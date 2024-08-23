/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const { isIP } = require('node:net');
const { Buffer } = require('node:buffer');

const RE2 = require('re2');
const _ = require('lodash');
const isBase64 = require('is-base64');
const isFQDN = require('is-fqdn');
const isSANB = require('is-string-and-not-blank');
const ms = require('ms');
const regexParser = require('regex-parser');
const { boolean } = require('boolean');
const { isURL, isEmail } = require('validator');

const SMTPError = require('#helpers/smtp-error');
const config = require('#config');
const env = require('#config/env');
const getErrorCode = require('#helpers/get-error-code');
const logger = require('#helpers/logger');
const parseAddresses = require('#helpers/parse-addresses');
const parseHostFromDomainOrAddress = require('#helpers/parse-host-from-domain-or-address');
const parseRootDomain = require('#helpers/parse-root-domain');
const parseUsername = require('#helpers/parse-username');
const { decrypt } = require('#helpers/encrypt-decrypt');

const USER_AGENT = `${config.pkg.name}/${config.pkg.version}`;

function parseFilter(address) {
  ({ address } = parseAddresses(address)[0]);
  return address.includes('+') ? address.split('+')[1].split('@')[0] : '';
}

// <https://github.com/pdl/regexp-capture-interpolation/blob/fbe04423b37699c2d653d9bc57b085c24dfe1c75/lib/index.js#L92>
const REGEX_INTERPOLATED_DOLLAR = new RE2(/(\$)([1-9]\d*|[$&`'])/);

// eslint-disable-next-line complexity
async function getForwardingAddresses(
  address,
  recursive = [],
  ignoreBilling = false,
  session
) {
  let hasIMAP = false;
  let aliasIds;

  const domain = parseHostFromDomainOrAddress(address);
  const rootDomain = parseRootDomain(domain);

  // if it is a truth source then don't bother fetching
  let records = [];
  if (domain !== rootDomain || !config.truthSources.has(rootDomain)) {
    try {
      records = await this.resolver.resolveTxt(domain);
    } catch (err) {
      logger.warn(err, { address });
      // support retries
      // TODO: rewrite `err.response` and `err.message` if either/both start with diagnostic code
      err.responseCode = getErrorCode(err);

      throw err;
    }

    try {
      const mxRecords = await this.resolver.resolveMx(domain);

      if (!mxRecords || mxRecords.length === 0) {
        records = [];
      } else {
        // let hasExchanges = false;
        // for (const record of mxRecords) {
        //   hasExchanges = config.exchanges.some(
        //     (exchange) => exchange === record.exchange.toLowerCase()
        //   );
        //   if (hasExchanges) break;
        // }
        // if (!hasExchanges) records = [];
      }
    } catch (err) {
      // support retries
      // TODO: rewrite `err.response` and `err.message` if either/both start with diagnostic code
      logger.warn(err, { address });

      if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
        records = [];
      } else {
        // support retries
        // TODO: rewrite `err.response` and `err.message` if either/both start with diagnostic code
        err.responseCode = getErrorCode(err);
        throw err;
      }
    }
  }

  // dns TXT record must contain `forward-email=` prefix
  const validRecords = [];

  // verifications must start with `forward-email-site-verification=` prefix
  const verifications = [];

  // add support for multi-line TXT records
  for (let i = 0; i < records.length; i++) {
    records[i] = records[i].join('').trim(); // join and trim chunks together
    if (records[i].indexOf(`${config.recordPrefix}=`) === 0) {
      let value = records[i].replace(`${config.recordPrefix}=`, '');
      if (isBase64(value)) {
        try {
          value = decrypt(
            Buffer.from(value, 'base64').toString('utf8'),
            env.TXT_ENCRYPTION_KEY
          );
        } catch (err) {
          logger.debug(err);
          try {
            value = decrypt(
              Buffer.from(value, 'base64').toString('hex'),
              env.TXT_ENCRYPTION_KEY
            );
          } catch (err) {
            logger.debug(err);
          }
        }
      }

      validRecords.push(value);
    }

    if (records[i].indexOf(`${config.recordPrefix}-site-verification=`) === 0)
      verifications.push(
        records[i].replace(`${config.recordPrefix}-site-verification=`, '')
      );
  }

  // check if we have a specific redirect and store global redirects (if any)
  // get username from recipient email address
  // (e.g. user@example.com => hello)
  const username = parseUsername(address);

  //
  // store if the domain was bad and not on paid plan (required for bad domains)
  //
  let badDomainExtension = true;
  for (const tld of config.goodDomains) {
    if (rootDomain.endsWith(`.${tld}`)) {
      badDomainExtension = false;
      break;
    }
  }

  if (!badDomainExtension) {
    for (const tld of config.restrictedDomains) {
      if (rootDomain === tld || rootDomain.endsWith(`.${tld}`)) {
        badDomainExtension = false;
        break;
      }
    }
  }

  if (verifications.length > 0) {
    if (verifications.length > 1)
      throw new SMTPError(
        // TODO: we may want to replace with "Invalid Recipients"
        `Domain ${domain} has multiple verification TXT records of "${config.recordPrefix}-site-verification" and should only have one`,
        { responseCode: 421 }
      );

    // TODO: cache responses in redis and purge on web-side changes

    // if there was a verification record then perform lookup
    const response = await this.apiClient.request({
      path: '/v1/lookup',
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        Authorization:
          'Basic ' + Buffer.from(env.API_SECRETS[0] + ':').toString('base64')
      },
      query: {
        username,
        ignore_billing: ignoreBilling,
        verification_record: verifications[0]
      }
    });

    const body = await response.body.json();
    // body = {
    //   has_imap: boolean,
    //   mapping: array
    // }
    hasIMAP = boolean(body.has_imap);
    if (hasIMAP) badDomainExtension = false;
    if (
      body.alias_ids &&
      Array.isArray(body.alias_ids) &&
      body.alias_ids.length > 0
    )
      aliasIds = body.alias_ids;
    // body is an Array of records that are formatted like TXT records
    if (_.isArray(body.mapping) && body.mapping.length > 0) {
      // update that domain was bad but on paid plan so OK
      badDomainExtension = false;

      // combine with any existing TXT records (ensures graceful DNS propagation)
      for (const element of body.mapping) {
        validRecords.push(element);
      }
    }
  }

  // join multi-line TXT records together and replace double w/single commas
  const record = validRecords.join(',').replace(/,+/g, ',').trim();

  // if the record was blank then throw an error
  if (!isSANB(record) && !hasIMAP)
    throw new SMTPError(
      `${address} is not yet configured with its email service provider ${config.urls.web} ;`,
      { responseCode: 421 }
    );

  // e.g. user@example.com => user@gmail.com
  // record = "forward-email=hello:user@gmail.com"
  // e.g. hello+test@example.com => user+test@gmail.com
  // record = "forward-email=hello:user@gmail.com"
  // e.g. *@example.com => user@gmail.com
  // record = "forward-email=user@gmail.com"
  // e.g. *+test@example.com => user@gmail.com
  // record = "forward-email=user@gmail.com"

  function splitString(str) {
    if (str.indexOf('/') === 0) {
      // it can either be split by ",/" or ","
      const index = str.includes(',/')
        ? str.lastIndexOf('/:', str.indexOf(',/'))
        : str.indexOf('/:');
      const lastComma = str.indexOf(',', index);
      if (lastComma === -1) return [str];
      if (lastComma === str.length - 1) return [str.slice(0, lastComma)];
      return [
        str.slice(0, lastComma),
        ...splitString(str.slice(lastComma + 1))
      ];
    }

    return str.includes(',')
      ? [
          str.slice(0, str.indexOf(',')),
          ...splitString(str.slice(str.indexOf(',') + 1))
        ]
      : [str];
  }

  // remove trailing whitespaces from each address listed
  const addresses = _.uniq(
    _.compact(
      record
        .split({
          [Symbol.split](str) {
            return splitString(str);
          }
        })
        .map((str) => str.trim())
    )
  );

  if (addresses.length === 0 && !hasIMAP)
    throw new SMTPError(
      // TODO: we may want to replace with "Invalid Recipients"
      `${address} domain of ${domain} has zero forwarded addresses configured in the TXT record with "${config.recordPrefix}"`,
      { responseCode: 421 }
    );

  // store if address is ignored or not
  let ignored = false; // 250
  let softRejected = false; // 421
  let hardRejected = false; // 550

  // store if we have a forwarding address or not
  let forwardingAddresses = [];

  // store if we have a global redirect or not
  const globalForwardingAddresses = [];

  for (let element of addresses) {
    // convert addresses to lowercase
    const lowerCaseAddress = element.toLowerCase();

    // must start with / and end with /: and not have the same index for the last index
    // forward-email=/^(support|info)$/:user+$1@gmail.com
    // -> would forward to user+support@gmail.com if email sent to support@

    // it either ends with:
    // "/gi:"
    // "/ig:"
    // "/g:"
    // "/i:"
    // "/:"
    //
    let lastIndex;
    const REGEX_FLAG_ENDINGS = ['/gi:', '/ig:', '/g:', '/i:', '/:'];

    // regex ignore support
    let wasIgnoredRegex = false;
    // ! -> 250
    if (
      element.startsWith('!') &&
      element.indexOf('/') === 1 &&
      element.endsWith('/')
    ) {
      element = element.slice(1) + ':';
      wasIgnoredRegex = true;
    }

    // !! -> 421
    if (
      element.startsWith('!!') &&
      element.indexOf('/') === 2 &&
      element.endsWith('/')
    ) {
      element = element.slice(2) + ':';
      wasIgnoredRegex = true;
    }

    // !!! -> 550
    if (
      element.startsWith('!!!') &&
      element.indexOf('/') === 3 &&
      element.endsWith('/')
    ) {
      element = element.slice(3) + ':';
      wasIgnoredRegex = true;
    }

    const hasTwoSlashes = element.lastIndexOf('/') !== 0;
    const startsWithSlash = element.indexOf('/') === 0;

    if (startsWithSlash && hasTwoSlashes) {
      for (const ending of REGEX_FLAG_ENDINGS) {
        if (
          element.lastIndexOf(ending) !== -1 &&
          element.lastIndexOf(ending) !== 0
        ) {
          lastIndex = ending;
          break;
        }
      }
    }

    //
    // regular expression support
    // <https://github.com/forwardemail/free-email-forwarding/pull/245/commits/e04ea02d700b51771bf61ed512d1763bbf80784b>
    // (with added support for regex gi flags)
    //
    if (startsWithSlash && hasTwoSlashes && lastIndex) {
      const elementWithoutRegex = element.slice(
        Math.max(0, element.lastIndexOf(lastIndex) + lastIndex.length)
      );

      let parsedRegex = element.slice(
        0,
        Math.max(0, element.lastIndexOf(lastIndex) + 1)
      );

      // add case insensitive flag since email addresses are case insensitive
      if (lastIndex === '/g:' || lastIndex === '/:') parsedRegex += 'i';
      //
      // `forward-email=/^(support|info)$/:user+$1@gmil.coail.com`
      // support@mydomain.com -> user+support@gmail.com
      //
      // `forward-email=/^(support|info)$/:example.com/$1`
      // info@mydomain.com -> POST to example.com/info
      //
      // `forward-email=/Support/g:example.com`
      //
      // `forward-email=/SUPPORT/gi:example.com`
      //
      let regex;
      try {
        // NOTE: catches errors like "Invalid regular expression":
        regex = new RE2(regexParser(parsedRegex));
      } catch (err) {
        logger.fatal(err, { address });
      }

      if (regex && regex.test(username.toLowerCase())) {
        const hasDollarInterpolation =
          REGEX_INTERPOLATED_DOLLAR.test(elementWithoutRegex);

        const substitutedAlias = hasDollarInterpolation
          ? username.toLowerCase().replace(regex, elementWithoutRegex)
          : elementWithoutRegex;

        if (
          (wasIgnoredRegex && !substitutedAlias) ||
          substitutedAlias.indexOf('!!!') === 0
        ) {
          hardRejected = true;
          break;
        }

        if (
          (wasIgnoredRegex && !substitutedAlias) ||
          substitutedAlias.indexOf('!!') === 0
        ) {
          softRejected = true;
          break;
        }

        if (
          (wasIgnoredRegex && !substitutedAlias) ||
          substitutedAlias.indexOf('!') === 0
        ) {
          ignored = true;
          break;
        }

        if (
          !isFQDN(substitutedAlias) &&
          !isIP(substitutedAlias) &&
          !isEmail(substitutedAlias, { ignore_max_length: true }) &&
          !isURL(substitutedAlias, config.isURLOptions)
        )
          throw new SMTPError(
            // TODO: we may want to replace with "Invalid Recipients"
            `Domain of ${domain} has an invalid "${config.recordPrefix}" TXT record due to an invalid regular expression email address match`
          );

        if (isURL(substitutedAlias, config.isURLOptions))
          forwardingAddresses.push(substitutedAlias);
        else forwardingAddresses.push(substitutedAlias.toLowerCase());
      }
    } else if (
      (element.includes(':') || element.indexOf('!') === 0) &&
      !isURL(element, config.isURLOptions)
    ) {
      // > const str = 'foo:https://foo.com'
      // > str.slice(0, str.indexOf(':'))
      // 'foo'
      // > str.slice(str.indexOf(':') + 1)
      // 'https://foo.com'
      const index = element.indexOf(':');
      const addr =
        index === -1
          ? [element]
          : [element.slice(0, index), element.slice(index + 1)];

      // addr[0] = hello (username)
      // addr[1] = user@gmail.com (forwarding email)
      // check if we have a match (and if it is ignored)
      if (_.isString(addr[0]) && addr[0].indexOf('!') === 0) {
        // !!! -> 550
        if (
          addr[0].indexOf('!!!') === 0 &&
          username === addr[0].toLowerCase().slice(3)
        ) {
          hardRejected = true;
          break;
        }

        // !! -> 421
        if (
          addr[0].indexOf('!!') === 0 &&
          username === addr[0].toLowerCase().slice(2)
        ) {
          softRejected = true;
          break;
        }

        // ! -> 250
        if (username === addr[0].toLowerCase().slice(1)) {
          ignored = true;
          break;
        }

        continue;
      }

      if (
        addr.length !== 2 ||
        !_.isString(addr[1]) ||
        (!isFQDN(addr[1]) &&
          !isIP(addr[1]) &&
          !isEmail(addr[1], { ignore_max_length: true }) &&
          !isURL(addr[1], config.isURLOptions))
      )
        throw new SMTPError(
          // TODO: we may want to replace with "Invalid Recipients"
          `${lowerCaseAddress} domain of ${domain} has an invalid "${config.recordPrefix}" TXT record due to an invalid email address of "${element}"`
        );

      if (_.isString(addr[0]) && username === addr[0].toLowerCase()) {
        if (isURL(addr[1], config.isURLOptions))
          forwardingAddresses.push(addr[1]);
        else forwardingAddresses.push(addr[1].toLowerCase());
      }
    } else if (isFQDN(lowerCaseAddress) || isIP(lowerCaseAddress)) {
      // allow domain alias forwarding
      // (e.. the record is just "b.com" if it's not a valid email)
      globalForwardingAddresses.push(`${username}@${lowerCaseAddress}`);
    } else if (isEmail(lowerCaseAddress, { ignore_max_length: true })) {
      globalForwardingAddresses.push(lowerCaseAddress);
    } else if (isURL(element, config.isURLOptions)) {
      globalForwardingAddresses.push(element);
    }
  }

  // if it was ignored then return early with false indicating it's disabled
  if (ignored) return { ignored };
  if (softRejected) return { softRejected };
  if (hardRejected) return { hardRejected };

  // if we don't have a specific forwarding address try the global redirect
  if (
    forwardingAddresses.length === 0 &&
    globalForwardingAddresses.length > 0 &&
    !hasIMAP
  ) {
    for (const address of globalForwardingAddresses) {
      forwardingAddresses.push(address);
    }
  }

  //
  // if the domain does not have any verifications
  // and if the domain ended with a bad domain
  // then we can reject the message and inform
  // the recipient with a one-time courtesy email
  //
  if (badDomainExtension && forwardingAddresses.length > 0)
    throw new SMTPError(
      `${address} requires an upgrade to Enhanced Protection at ${config.urls.web} ;  Please read ${config.urls.web}/faq#what-domain-name-extensions-can-be-used-for-free for more information`
    );

  // if we don't have a forwarding address then throw an error
  if (forwardingAddresses.length === 0 && !hasIMAP) {
    throw new SMTPError(
      `${address} is not yet configured with its email service provider ${config.urls.web} ;`,
      { responseCode: 421 }
    );
  }

  //
  // ensure forwarding addresses are unique to prevent additional hops
  // TODO: we could also do indexOf or includes check above before pushing
  //
  forwardingAddresses = _.uniq(forwardingAddresses);

  // TODO: isn't actually utilized since `recursive` arg not used
  //       (e.g. we don't do MX lookup on the TXT we're forwarding to)
  // allow one recursive lookup on forwarding addresses
  const recursivelyForwardedAddresses = [];

  const { length } = forwardingAddresses;
  for (let x = 0; x < length; x++) {
    const forwardingAddress = forwardingAddresses[x];
    try {
      // TODO: is the culprit
      if (recursive.includes(forwardingAddress)) continue;
      if (isURL(forwardingAddress, config.isURLOptions)) continue;

      const newRecursive = [...forwardingAddresses, ...recursive];

      // prevent a double-lookup if user is using + symbols
      if (forwardingAddress.includes('+'))
        newRecursive.push(
          `${parseUsername(address)}@${parseHostFromDomainOrAddress(address)}`
        );

      // support recursive IMAP lookup
      // eslint-disable-next-line no-await-in-loop
      const data = await getForwardingAddresses.call(
        this,
        forwardingAddress,
        newRecursive,
        ignoreBilling,
        session
      );

      if (data.hasIMAP) hasIMAP = true;
      if (
        data.aliasIds &&
        Array.isArray(data.aliasIds) &&
        data.aliasIds.length > 0
      ) {
        if (!aliasIds) aliasIds = [];
        for (const id of data.aliasIds) {
          if (!aliasIds.includes(id)) aliasIds.push(id);
        }
      }

      // if address was ignored then skip adding it
      if (data.ignored) continue;
      if (data.softRejected) continue;
      if (data.hardRejected) continue;

      // if it was recursive then remove the original
      if (data.addresses.length > 0 || data.hasIMAP)
        recursivelyForwardedAddresses.push(forwardingAddress);
      // add the recursively forwarded addresses
      for (const element of data.addresses) {
        forwardingAddresses.push(element);
      }
    } catch (err) {
      logger.error(err);
    }
  }

  // make the forwarding addresses unique
  // (and omit the recursively forwarded addresses)
  forwardingAddresses = _.uniq(
    _.compact(
      forwardingAddresses.map((addr) => {
        if (!recursivelyForwardedAddresses.includes(addr)) return addr;
        return null;
      })
    )
  );

  // lookup here to determine max forwarded addresses on the domain
  // if max number of forwarding addresses exceeded
  let { maxForwardedAddresses } = config;

  // attempt to get cached value for domain
  let value = false;
  try {
    value = await this.client.get(`v1_max_forwarded:${domain}`);
    if (value) {
      value = Number.parseInt(value, 10);
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        value = false;
        await this.client.del(`v1_max_forwarded:${domain}`);
      }
    }
  } catch (err) {
    value = false;
    logger.fatal(err);
  }

  if (value) {
    maxForwardedAddresses = value;
  } else {
    try {
      const response = await this.apiClient.request({
        path: '/v1/max-forwarded-addresses',
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
          Authorization:
            'Basic ' + Buffer.from(env.API_SECRETS[0] + ':').toString('base64')
        },
        query: {
          domain
        }
      });

      const body = await response.body.json();
      // body is an Object with `max_forwarded_addresses` Number
      if (
        _.isObject(body) &&
        _.isNumber(body.max_forwarded_addresses) &&
        body.max_forwarded_addresses > 0
      )
        maxForwardedAddresses = body.max_forwarded_addresses;
      await this.client.set(
        `v1_max_forwarded:${domain}`,
        maxForwardedAddresses,
        'PX',
        ms('1h')
      );
    } catch (err) {
      err.isCodeBug = true;
      logger.error(err);
    }
  }

  if (forwardingAddresses.length > maxForwardedAddresses) {
    throw new SMTPError(
      `The address ${address} is attempted to be forwarded to (${forwardingAddresses.length}) addresses which exceeds the maximum of (${maxForwardedAddresses})`,
      { responseCode: 421 }
    );
  }

  // otherwise transform the + symbol filter if we had it
  // and then resolve with the newly formatted forwarding address
  // (we can return early here if there was no + symbol)
  if (!address.includes('+'))
    return { aliasIds, hasIMAP, addresses: forwardingAddresses };

  return {
    aliasIds,
    hasIMAP,
    addresses: forwardingAddresses.map((forwardingAddress) => {
      if (
        isFQDN(forwardingAddress) ||
        isIP(forwardingAddress) ||
        isURL(forwardingAddress, config.isURLOptions)
      )
        return forwardingAddress;

      return `${parseUsername(forwardingAddress)}+${parseFilter(
        address
      )}@${parseHostFromDomainOrAddress(forwardingAddress)}`;
    })
  };
}

module.exports = getForwardingAddresses;