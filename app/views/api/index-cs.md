# Rozhraní API pro e-maily {#email-api}

__CHRÁNĚNÁ_URL_158__ Obsah {__CHRÁNĚNÁ_URL_159__

* [Knihovny](#libraries)
* [Základní URI](#base-uri)
* [Autentizace](#authentication)
* [Chyby](#errors)
* [Lokalizace](#localization)
* [Stránkování](#pagination)
* [Protokoly](#logs)
  * [Načíst protokoly](#retrieve-logs)
* [Účet](#account)
  * [Vytvořit účet](#create-account)
  * [Načíst účet](#retrieve-account)
  * [Aktualizovat účet](#update-account)
* [Alias Contacts (CardDAV)](#alias-contacts-carddav)
  * [Seznam kontaktů](#list-contacts)
  * [Vytvořte kontakt](#create-contact)
  * [Získat kontakt](#retrieve-contact)
  * [Aktualizujte kontakt](#update-contact)
  * [Smazat kontakt](#delete-contact)
* [Aliasové kalendáře (CalDAV)](#alias-calendars-caldav)
  * [Seznam kalendářů](#list-calendars)
  * [Vytvořit kalendář](#create-calendar)
  * [Načíst kalendář](#retrieve-calendar)
  * [Aktualizovat kalendář](#update-calendar)
  * [Smazat kalendář](#delete-calendar)
* [Aliasové zprávy (IMAP/POP3)](#alias-messages-imappop3)
  * [Seznam a vyhledávání zpráv](#list-and-search-for-messages)
  * [Vytvořit zprávu](#create-message)
  * [Načíst zprávu](#retrieve-message)
  * [Aktualizovat zprávu](#update-message)
  * [Smazat zprávu](#delete-message)
* [Alias složky (IMAP/POP3)](#alias-folders-imappop3)
  * [Seznam složek](#list-folders)
  * [Vytvořit složku](#create-folder)
  * [Načíst složku](#retrieve-folder)
  * [Aktualizovat složku](#update-folder)
  * [Smazat složku](#delete-folder)
  * [Kopírovat složku](#copy-folder)
* [Odchozí e-maily](#outbound-emails)
  * [Získejte limit odchozích e-mailů SMTP](#get-outbound-smtp-email-limit)
  * [Seznam odchozích e-mailů SMTP](#list-outbound-smtp-emails)
  * [Vytvořte odchozí e-mail SMTP](#create-outbound-smtp-email)
  * [Načíst odchozí e-maily SMTP](#retrieve-outbound-smtp-email)
  * [Smazat odchozí e-maily SMTP](#delete-outbound-smtp-email)
* [domény](#domains)
  * [Seznam domén](#list-domains)
  * [Vytvořte doménu](#create-domain)
  * [Načíst doménu](#retrieve-domain)
  * [Ověřte záznamy domény](#verify-domain-records)
  * [Ověření SMTP záznamů domény](#verify-domain-smtp-records)
  * [Vypsat hesla pro celou doménu](#list-domain-wide-catch-all-passwords)
  * [Vytvořte heslo pro celou doménu](#create-domain-wide-catch-all-password)
  * [Odebrat heslo pro celou doménu](#remove-domain-wide-catch-all-password)
  * [Aktualizujte doménu](#update-domain)
  * [Smazat doménu](#delete-domain)
* [Pozvánky](#invites)
  * [Přijmout pozvání domény](#accept-domain-invite)
  * [Vytvořte pozvánku do domény](#create-domain-invite)
  * [Odebrat pozvánku do domény](#remove-domain-invite)
* [členové](#members)
  * [Aktualizovat člena domény](#update-domain-member)
  * [Odebrat člena domény](#remove-domain-member)
* [Přezdívky](#aliases)
  * [Vygenerujte aliasové heslo](#generate-an-alias-password)
  * [Vypsat aliasy domén](#list-domain-aliases)
  * [Vytvořte nový alias domény](#create-new-domain-alias)
  * [Načíst alias domény](#retrieve-domain-alias)
  * [Aktualizujte alias domény](#update-domain-alias)
  * [Smazat alias domény](#delete-domain-alias)
* [Šifrovat](#encrypt)
  * [Šifrovat TXT záznam](#encrypt-txt-record)

__CHRÁNĚNÁ_URL_160__ Knihovny {__CHRÁNĚNÁ_URL_161__

V současné době jsme nevydali žádné API wrappery, ale plánujeme to v blízké budoucnosti. Pokud chcete být upozorněni na vydání API wrapperu pro konkrétní programovací jazyk, pošlete e-mail na adresu <api@forwardemail.net>. Mezitím můžete ve své aplikaci použít tyto doporučené knihovny HTTP požadavků nebo jednoduše použít [kučera](https://stackoverflow.com/a/27442239/3586413), jak je uvedeno v níže uvedených příkladech.

| Jazyk | Knihovna |
| ---------- | ---------------------------------------------------------------------- |
| Rubín | [Faraday](https://github.com/lostisland/faraday) |
| Krajta | [requests](https://github.com/psf/requests) |
| Jáva | [OkHttp](https://github.com/square/okhttp/) |
| PHP | [guzzle](https://github.com/guzzle/guzzle) |
| JavaScript | [superagent](https://github.com/ladjs/superagent) (jsme správci) |
| Node.js | [superagent](https://github.com/ladjs/superagent) (jsme správci) |
| Jít | [net/http](https://golang.org/pkg/net/http/) |
| .NET | [RestSharp](https://github.com/restsharp/RestSharp) |

## Základní URI {#base-uri}

Aktuální základní cesta URI protokolu HTTP je: `BASE_URI`.

__CHRÁNĚNÁ_URL_164__ Ověřování {__CHRÁNĚNÁ_URL_165__

Všechny koncové body vyžadují, aby vaše [API klíč](https://forwardemail.net/my-account/security) byla nastavena jako hodnota „uživatelské jméno“ v záhlaví [Základní oprávnění](https://en.wikipedia.org/wiki/Basic_access_authentication) požadavku (s výjimkou [Alias Kontakty](#alias-contacts), [Alias kalendáře](#alias-calendars) a [Alias poštovní schránky](#alias-mailboxes), které používají [vygenerovaný alias uživatelské jméno a heslo](/faq#do-you-support-receiving-email-with-imap)).

Nebojte se – níže jsou uvedeny příklady, pokud si nejste jisti, co to je.

## Chyby {#errors}

Pokud se vyskytnou nějaké chyby, tělo odpovědi požadavku API bude obsahovat podrobnou chybovou zprávu.

| Kód | Jméno |
| ---- | --------------------- |
| 200 | OK |
| 400 | Špatný požadavek |
| 401 | Neoprávněný |
| 403 | Zakázáno |
| 404 | Nenalezeno |
| 429 | Příliš mnoho požadavků |
| 500 | Interní chyba serveru |
| 501 | Neimplementováno |
| 502 | Špatná brána |
| 503 | Služba není k dispozici |
| 504 | Časový limit brány |

> \[!TIP]
> If you receive a 5xx status code (which should not happen), then please contact us at <a href="mailto:api@forwardemail.net"><api@forwardemail.net></a> and we will help you to resolve your issue immediately.

## Lokalizace {#localization}

Naše služba je přeložena do více než 25 různých jazyků. Všechny odpovědi API jsou přeloženy do posledního zjištěného jazyka uživatele, který API požadavek zadává. Toto nastavení můžete přepsat zadáním vlastní hlavičky `Accept-Language`. Neváhejte si to vyzkoušet pomocí rozbalovací nabídky jazyků v dolní části této stránky.

## Stránkování {#pagination}

> \[!NOTE]
> As of November 1st, 2024 the API endpoints for [List domains](#list-domains) and [List domain aliases](#list-domain-aliases) will default to `1000` max results per page.  If you would like to opt-in to this behavior early, you can pass `?paginate=true` as an additional querystring parameter to the URL for the endpoint query.

Stránkování je podporováno všemi koncovými body API, které vypisují výsledky.

Jednoduše zadejte vlastnosti řetězce dotazu `page` (a volitelně `limit`).

Vlastnost `page` by měla být číslo větší nebo rovné `1`. Pokud zadáte `limit` (také číslo), pak je minimální hodnota `10` a maximální je `50` (pokud není uvedeno jinak).

| Parametry řetězce dotazů | Požadovaný | Typ | Popis |
| --------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page` | Žádný | Číslo | Stránka s výsledky, které se mají vrátit. Pokud není zadána hodnota `page`, bude hodnota `1`. Musí se jednat o číslo větší nebo rovno `1`. |
| `limit` | Žádný | Číslo | Počet výsledků, které se mají vrátit na stránku. Výchozí hodnota je `10`, pokud není zadán. Musí se jednat o číslo větší nebo rovno `1` a menší nebo rovno `50`. |

Abychom zjistili, zda je nebo není k dispozici více výsledků, poskytujeme tato záhlaví odpovědí HTTP (která můžete analyzovat, abyste je mohli programově stránkovat):

| Hlavička odpovědi HTTP | Příklad | Popis |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `X-Page-Count` | `X-Page-Count: 3` | Celkový počet dostupných stránek. |
| `X-Page-Current` | `X-Page-Current: 1` | Aktuální stránka vrácených výsledků (např. na základě parametru `page` řetězce dotazu). |
| `X-Page-Size` | `X-Page-Size: 10` | Celkový počet vrácených výsledků na stránce (např. na základě parametru `limit` řetězce dotazu a skutečně vrácených výsledků). |
| `X-Item-Count` | `X-Item-Count: 30` | Celkový počet položek dostupných na všech stránkách. |
| `Link` | `Link: <https://api.forwardemail.net/v1/emails?page=1>; rel="prev", <https://api.forwardemail.net/v1/emails?page=3>; rel="next", <https://api.forwardemail.net/v1/emails?page=3; rel="last", https://api.forwardemail.net/v1/emails?page=1; rel="first"` | Poskytujeme hlavičku HTTP odpovědi s `Link`, kterou můžete analyzovat, jak je znázorněno v příkladu. Jedná se o [similar to GitHub](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api#using-link-headers) (např. nebudou poskytnuty všechny hodnoty, pokud nejsou relevantní nebo dostupné, např. `"next"` nebude poskytnuta, pokud neexistuje jiná stránka). |

> Příklad požadavku:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/aliases?page=2&pagination=true \
  -u API_TOKEN:
```

__CHRÁNĚNÁ_URL_172__ Záznamy {__CHRÁNĚNÁ_URL_173__

### Načíst protokoly {#retrieve-logs}

Naše API vám programově umožňuje stahovat protokoly pro váš účet. Odesláním požadavku do tohoto koncového bodu zpracujete všechny protokoly pro váš účet a po dokončení vám je odešlete e-mailem jako přílohu ([Gzip](https://en.wikipedia.org/wiki/Gzip) komprimovaný soubor tabulky [CSV](https://en.wikipedia.org/wiki/Comma-separated_values)).

To vám umožňuje vytvářet úlohy na pozadí s [Cron práce](https://en.wikipedia.org/wiki/Cron) nebo pomocí našeho [Node.js software pro plánování úloh Bree](https://github.com/breejs/bree) k přijímání protokolů, kdykoli budete chtít. Upozorňujeme, že tento koncový bod je omezen na `10` požadavky za den.

Příloha je malými písmeny ve tvaru `email-deliverability-logs-YYYY-MM-DD-h-mm-A-z.csv.gz` a samotný e-mail obsahuje stručné shrnutí načtených protokolů. Protokoly si také můžete kdykoli stáhnout z adresy [Můj účet → Protokoly](/my-account/logs).

> `GET /v1/logs/download`

| Parametry řetězce dotazů | Požadovaný | Typ | Popis |
| --------------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `domain` | Žádný | Řetězec (FQDN) | Filtrujte protokoly podle plně kvalifikované domény ("FQDN").  Pokud toto nezadáte, budou načteny všechny protokoly ze všech domén. |
| `q` | Žádný | Řetězec | Vyhledávání protokolů podle e-mailu, domény, aliasu, IP adresy nebo data (formát `M/Y`, `M/D/YY`, `M-D`, `M-D-YY` nebo `M.D.YY`). |
| `bounce_category` | Žádný | Řetězec | Vyhledávání protokolů podle konkrétní kategorie nedoručených zpráv (např. `blocklist`). |
| `response_code` | Žádný | Číslo | Vyhledávání protokolů podle konkrétního kódu chybové odpovědi (např. `421` nebo `550`). |

> Příklad požadavku:

```sh
curl BASE_URI/v1/logs/download \
  -u API_TOKEN:
```

> Příklad úlohy Cron (každý den o půlnoci):

```sh
0 0 * * * /usr/bin/curl BASE_URI/v1/logs/download -u API_TOKEN: &>/dev/null
```

Upozorňujeme, že k ověření syntaxe výrazu vaší cron úlohy můžete použít služby jako například [Crontab.guru](https://crontab.guru/).

> Příklad úlohy Cron (každý den o půlnoci **a se záznamy z předchozího dne**):

Pro MacOS:

```sh
0 0 * * * /usr/bin/curl BASE_URI/v1/logs/download?q=`date -v-1d -u "+%-m/%-d/%y"` -u API_TOKEN: &>/dev/null
```

Pro Linux a Ubuntu:

```sh
0 0 * * * /usr/bin/curl BASE_URI/v1/logs/download?q=`date --date "-1 days" -u "+%-m/%-d/%y"` -u API_TOKEN: &>/dev/null
```

__CHRÁNĚNÁ_URL_176__ Účet {__CHRÁNĚNÁ_URL_177__

### Vytvořit účet {#create-account}

> `POST /v1/account`

| Parametr těla | Požadovaný | Typ | Popis |
| -------------- | -------- | -------------- | ------------- |
| `email` | Ano | řetězec (e-mail) | E-mailová adresa |
| `password` | Ano | Řetězec | Heslo |

> Příklad požadavku:

```sh
curl -X POST BASE_URI/v1/account \
  -u API_TOKEN: \
  -d "email=EMAIL"
```

### Obnovit účet {#retrieve-account}

> `GET /v1/account`

> Příklad požadavku:

```sh
curl BASE_URI/v1/account \
  -u API_TOKEN:
```

### Aktualizovat účet {#update-account}

> `PUT /v1/account`

| Parametr těla | Požadovaný | Typ | Popis |
| -------------- | -------- | -------------- | -------------------- |
| `email` | Žádný | řetězec (e-mail) | E-mailová adresa |
| `given_name` | Žádný | Řetězec | Křestní jméno |
| `family_name` | Žádný | Řetězec | Příjmení |
| `avatar_url` | Žádný | řetězec (URL) | Odkaz na obrázek avatara |

> Příklad požadavku:

```sh
curl -X PUT BASE_URI/v1/account \
  -u API_TOKEN: \
  -d "email=EMAIL"
```

## Alias kontakty (CardDAV) {#alias-contacts-carddav}

> \[!NOTE]
> Unlike other API endpoints, these require [Authentication](#authentication) "username" equal to the alias username and "password" equal to the alias generated password as Basic Authorization headers.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

### Seznam kontaktů {#list-contacts}

> `GET /v1/contacts`

**Již brzy**

### Vytvořit kontakt {#create-contact}

> `POST /v1/contacts`

**Již brzy**

### Načíst kontakt {#retrieve-contact}

> `GET /v1/contacts/:id`

**Již brzy**

### Aktualizovat kontakt {#update-contact}

> `PUT /v1/contacts/:id`

**Již brzy**

### Smazat kontakt {#delete-contact}

> `DELETE /v1/contacts/:id`

**Již brzy**

## Aliasové kalendáře (CalDAV) {#alias-calendars-caldav}

> \[!NOTE]
> Unlike other API endpoints, these require [Authentication](#authentication) "username" equal to the alias username and "password" equal to the alias generated password as Basic Authorization headers.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

### Zobrazit kalendáře {#list-calendars}

> `GET /v1/calendars`

**Již brzy**

### Vytvořit kalendář {#create-calendar}

> `POST /v1/calendars`

**Již brzy**

### Načíst kalendář {#retrieve-calendar}

> `GET /v1/calendars/:id`

**Již brzy**

### Aktualizovat kalendář {#update-calendar}

> `PUT /v1/calendars/:id`

**Již brzy**

### Smazat kalendář {#delete-calendar}

> `DELETE /v1/calendars/:id`

**Již brzy**

## Alias zprávy (IMAP/POP3) {#alias-messages-imappop3}

> \[!NOTE]
> Unlike other API endpoints, these require [Authentication](#authentication) "username" equal to the alias username and "password" equal to the alias generated password as Basic Authorization headers.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

Ujistěte se, že jste postupovali podle pokynů pro nastavení vaší domény.

Tyto pokyny naleznete v sekci Často kladených otázek [Podporujete přijímání e-mailů pomocí protokolu IMAP?](/faq#do-you-support-receiving-email-with-imap).

### Zobrazení a vyhledávání zpráv {#list-and-search-for-messages}

> `GET /v1/messages`

**Již brzy**

### Vytvořit zprávu {#create-message}

> \[!NOTE]
> This will **NOT** send an email – it will only simply add the message to your mailbox folder (e.g. this is similar to the IMAP `APPEND` command).  If you would like to send an email, then see [Create outbound SMTP email](#create-outbound-smtp-email) below.  After creating the outbound SMTP email, then you can append a copy of it using this endpoint to your alias' mailbox for storage purposes.

> `POST /v1/messages`

**Již brzy**

### Načíst zprávu {#retrieve-message}

> `GET /v1/messages/:id`

**Již brzy**

### Aktualizační zpráva {#update-message}

> `PUT /v1/messages/:id`

**Již brzy**

### Smazat zprávu {#delete-message}

> `DELETE /v1/messages:id`

**Již brzy**

## Aliasy složek (IMAP/POP3) {#alias-folders-imappop3}

> \[!TIP]
> Folder endpoints with a folder's path <code>/v1/folders/:path</code> as their endpoint are interchangeable with a folder's ID <code>:id</code>. This means you can refer to the folder by either its <code>path</code> or <code>id</code> value.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

### Seznam složek {#list-folders}

> `GET /v1/folders`

**Již brzy**

### Vytvořit složku {#create-folder}

> `POST /v1/folders`

**Již brzy**

### Načíst složku {#retrieve-folder}

> `GET /v1/folders/:id`

**Již brzy**

### Aktualizovat složku {#update-folder}

> `PUT /v1/folders/:id`

**Již brzy**

### Smazat složku {#delete-folder}

> `DELETE /v1/folders/:id`

**Již brzy**

### Kopírovat složku {#copy-folder}

> `POST /v1/folders/:id/copy`

**Již brzy**

## Odchozí e-maily {#outbound-emails}

Ujistěte se, že jste postupovali podle pokynů pro nastavení vaší domény.

Tyto pokyny naleznete na adrese [Můj účet → Domény → Nastavení → Konfigurace odchozího SMTP](/my-account/domains). Pro odesílání odchozích SMTP zpráv s vaší doménou je nutné nastavit DKIM, Return-Path a DMARC.

### Získat limit odchozích e-mailů SMTP {#get-outbound-smtp-email-limit}

Toto je jednoduchý koncový bod, který vrací objekt JSON obsahující `count` a `limit` pro počet denních odchozích zpráv SMTP na základě jednotlivých účtů.

> `GET /v1/emails/limit`

> Příklad požadavku:

```sh
curl BASE_URI/v1/emails/limit \
  -u API_TOKEN:
```

### Zobrazit odchozí e-maily SMTP {#list-outbound-smtp-emails}

Všimněte si, že tento koncový bod nevrací hodnoty vlastností pro `message`, `headers` ani `rejectedErrors` e-mailu.

Chcete-li vrátit tyto vlastnosti a jejich hodnoty, použijte koncový bod [Načíst e-mail](#retrieve-email) s ID e-mailu.

> `GET /v1/emails`

| Parametry řetězce dotazů | Požadovaný | Typ | Popis |
| --------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `q` | Žádný | Řetězec (podporováno RegExp) | Vyhledávejte e-maily podle metadat |
| `domain` | Žádný | Řetězec (podporováno RegExp) | Vyhledávejte e-maily podle názvu domény |
| `sort` | Žádný | Řetězec | Seřadit podle konkrétního pole (předpona s jednou pomlčkou `-` se seřadí v opačném směru než toto pole). Pokud není nastaveno, výchozí hodnota je `created_at`. |
| `page` | Žádný | Číslo | Více informací naleznete na [Pagination](#pagination) |
| `limit` | Žádný | Číslo | Více informací naleznete na [Pagination](#pagination) |

> Příklad požadavku:

```sh
curl BASE_URI/v1/emails?limit=1 \
  -u API_TOKEN:
```

### Vytvořit odchozí SMTP e-mail {#create-outbound-smtp-email}

Naše API pro vytváření e-mailů je inspirováno a využívá konfiguraci možností zpráv v Nodemaileru. Pro všechny parametry těla zprávy se prosím řiďte níže uvedenými pokyny [Konfigurace zpráv Nodemailer](https://nodemailer.com/message/).

Upozorňujeme, že s výjimkou `envelope` a `dkim` (protože je nastavujeme automaticky) podporujeme všechny možnosti Nodemaileru. Možnosti `disableFileAccess` a `disableUrlAccess` z bezpečnostních důvodů automaticky nastavujeme na `true`.

Buď byste měli předat jednu možnost `raw` s vaším nezpracovaným celým e-mailem včetně záhlaví, **nebo** níže předat jednotlivé možnosti parametrů těla.

Tento koncový bod API automaticky zakóduje emoji, pokud se nacházejí v záhlavích (např. předmět `Subject: 🤓 Hello` se automaticky převede na `Subject: =?UTF-8?Q?=F0=9F=A4=93?= Hello`). Naším cílem bylo vytvořit e-mailové API, které je extrémně uživatelsky přívětivé a odolné vůči falešným kódům.

> `POST /v1/emails`

| Parametr těla | Požadovaný | Typ | Popis |
| ---------------- | -------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from` | Žádný | řetězec (e-mail) | E-mailová adresa odesílatele (musí existovat jako alias domény). |
| `to` | Žádný | String nebo Array | Čárkami oddělený seznam nebo pole příjemců pro záhlaví „Komu“. |
| `cc` | Žádný | String nebo Array | Čárkami oddělený seznam nebo pole příjemců pro záhlaví „Kopie“. |
| `bcc` | Žádný | String nebo Array | Čárkami oddělený seznam nebo pole příjemců pro záhlaví „Skrytá kopie“. |
| `subject` | Žádný | Řetězec | Předmět e-mailu. |
| `text` | Žádný | Řetězec nebo vyrovnávací paměť | Verze zprávy v otevřeném textu. |
| `html` | Žádný | Řetězec nebo vyrovnávací paměť | HTML verze zprávy. |
| `attachments` | Žádný | Pole | Pole objektů příloh (viz [Nodemailer's common fields](https://nodemailer.com/message/#common-fields)). |
| `sender` | Žádný | Řetězec | E-mailová adresa pro záhlaví „Odesílatel“ (viz [Nodemailer's more advanced fields](https://nodemailer.com/message/#more-advanced-fields)). |
| `replyTo` | Žádný | Řetězec | E-mailová adresa pro záhlaví „Reply-To“. |
| `inReplyTo` | Žádný | Řetězec | ID zprávy, na kterou zpráva odpovídá. |
| `references` | Žádný | String nebo Array | Seznam oddělený mezerou nebo pole ID zpráv. |
| `attachDataUrls` | Žádný | Boolean | Pokud `true`, pak převede obrázky `data:` v HTML obsahu zprávy na vložené přílohy. |
| `watchHtml` | Žádný | Řetězec | HTML verze zprávy specifická pro Apple Watch ([according to the Nodemailer docs](https://nodemailer.com/message/#content-options]), nejnovější hodinky toto nastavení nevyžadují). |
| `amp` | Žádný | Řetězec | HTML verze zprávy specifická pro AMP4EMAIL (viz [Nodemailer's example](https://nodemailer.com/message/#amp-example)). |
| `icalEvent` | Žádný | Objekt | Událost iCalendar, která se má použít jako alternativní obsah zprávy (viz [Nodemailer's calendar events](https://nodemailer.com/message/calendar-events/)). |
| `alternatives` | Žádný | Pole | Pole alternativního obsahu zprávy (viz [Nodemailer's alternative content](https://nodemailer.com/message/alternatives/)). |
| `encoding` | Žádný | Řetězec | Kódování textu a řetězců HTML (výchozí nastavení je `"utf-8"`, ale podporuje i kódování `"hex"` a `"base64"`). |
| `raw` | Žádný | Řetězec nebo vyrovnávací paměť | Vlastní generovaná zpráva ve formátu RFC822, která se má použít (namísto zprávy generované Nodemailerem – viz [Nodemailer's custom source](https://nodemailer.com/message/custom-source/)). |
| `textEncoding` | Žádný | Řetězec | Kódování, které je vynuceno použít pro textové hodnoty (buď `"quoted-printable"` nebo `"base64"`). Výchozí hodnota je nejbližší detekovaná hodnota (pro ASCII použijte `"quoted-printable"`). |
| `priority` | Žádný | Řetězec | Úroveň priority pro e-mail (může být buď `"high"`, `"normal"` (výchozí) nebo `"low"`). Upozorňujeme, že hodnota `"normal"` nenastavuje záhlaví priority (toto je výchozí chování). Pokud je nastavena hodnota `"high"` nebo `"low"`, pak záhlaví `X-Priority`, `X-MSMail-Priority` a `Importance` mají hodnotu [will be set accordingly](https://github.com/nodemailer/nodemailer/blob/19fce2dc4dcb83224acaf1cfc890d08126309594/lib/mailer/mail-message.js#L222-L240). |
| `headers` | Žádný | Objekt nebo pole | Objekt nebo pole dalších polí záhlaví, která mají být nastavena (viz [Nodemailer's custom headers](https://nodemailer.com/message/custom-headers/)). |
| `messageId` | Žádný | Řetězec | Volitelná hodnota Message-ID pro záhlaví „Message-ID“ (pokud není nastavena, bude automaticky vytvořena výchozí hodnota – hodnota by měla být [adhere to the RFC2822 specification](https://stackoverflow.com/a/4031705)). |
| `date` | Žádný | Řetězec nebo Datum | Nepovinná hodnota Date, která se použije, pokud po analýze chybí záhlaví Date, jinak bude použit aktuální řetězec UTC, pokud není nastaven.  Záhlaví data nesmí být více než 30 dní před aktuálním časem. |
| `list` | Žádný | Objekt | Volitelný objekt záhlaví `List-*` (viz [Nodemailer's list headers](https://nodemailer.com/message/list-headers/)). |

> Příklad požadavku:

```sh
curl -X POST BASE_URI/v1/emails \
  -u API_TOKEN: \
  -d "from=alias@DOMAIN_NAME" \
  -d "to=EMAIL" \
  -d "subject=test" \
  -d "text=test"
```

> Příklad požadavku:

```sh
curl -X POST BASE_URI/v1/emails \
  -u API_TOKEN: \
  -d "raw=`cat file.eml`"
```

### Načíst odchozí e-maily SMTP {#retrieve-outbound-smtp-email}

> `GET /v1/emails/:id`

> Příklad požadavku:

```sh
curl BASE_URI/v1/emails/:id \
  -u API_TOKEN:
```

### Smazat odchozí SMTP e-mail {#delete-outbound-smtp-email}

Smazání e-mailu nastaví stav na `"rejected"` (a následně jej nezpracuje ve frontě) pouze tehdy, když je aktuální stav jeden z `"pending"`, `"queued"` nebo `"deferred"`. E-maily můžeme automaticky smazat po 30 dnech od jejich vytvoření a/nebo odeslání – proto byste si měli uchovávat kopii odchozích SMTP e-mailů ve svém klientovi, databázi nebo aplikaci. V případě potřeby můžete ve své databázi odkazovat na hodnotu našeho ID e-mailu – tato hodnota je vrácena z koncových bodů [Vytvořit e-mail](#create-email) i [Načíst e-mail](#retrieve-email).

> `DELETE /v1/emails/:id`

> Příklad požadavku:

```sh
curl -X DELETE BASE_URI/v1/emails/:id \
  -u API_TOKEN:
```

__CHRÁNĚNÁ_URL_246__ Domény {__CHRÁNĚNÁ_URL_247__

> \[!TIP]
> Domain endpoints with a domain's name <code>/v1/domains/:domain_name</code> as their endpoint are interchangeable with a domain's ID <code>:domain_id</code>. This means you can refer to the domain by either its <code>name</code> or <code>id</code> value.

### Seznam domén {#list-domains}

> \[!NOTE]
> As of November 1st, 2024 the API endpoints for [List domains](#list-domains) and [List domain aliases](#list-domain-aliases) will default to `1000` max results per page.  If you would like to opt-in to this behavior early, you can pass `?paginate=true` as an additional querystring parameter to the URL for the endpoint query.  See [Pagination](#pagination) for more insight.

> `GET /v1/domains`

| Parametry řetězce dotazů | Požadovaný | Typ | Popis |
| --------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `q` | Žádný | Řetězec (podporováno RegExp) | Hledejte domény podle názvu |
| `name` | Žádný | Řetězec (podporováno RegExp) | Hledejte domény podle názvu |
| `sort` | Žádný | Řetězec | Seřadit podle konkrétního pole (předpona s jednou pomlčkou `-` se seřadí v opačném směru než toto pole). Pokud není nastaveno, výchozí hodnota je `created_at`. |
| `page` | Žádný | Číslo | Více informací naleznete na [Pagination](#pagination) |
| `limit` | Žádný | Číslo | Více informací naleznete na [Pagination](#pagination) |

> Příklad požadavku:

```sh
curl BASE_URI/v1/domains \
  -u API_TOKEN:
```

### Vytvořit doménu {#create-domain}

> `POST /v1/domains`

| Parametr těla | Požadovaný | Typ | Popis |
| ------------------------------ | -------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain` | Ano | Řetězec (FQDN nebo IP) | Plně kvalifikovaný název domény ("FQDN") nebo IP adresa |
| `team_domain` | Žádný | Řetězec (ID domény nebo název domény; FQDN) | Automaticky přiřadit tuto doménu stejnému týmu z jiné domény. To znamená, že všichni členové z této domény budou přiřazeni jako členové týmu a `plan` bude automaticky také nastaven na `team`. V případě potřeby můžete nastavit na `"none"`, abyste tuto funkci explicitně zakázali, ale není to nutné. |
| `plan` | Žádný | Řetězec (spočetný) | Typ tarifu (musí být `"free"`, `"enhanced_protection"` nebo `"team"`, výchozí nastavení je `"free"` nebo aktuální placený tarif uživatele, pokud jej má) |
| `catchall` | Žádný | String (e-mailové adresy s oddělovači) nebo Boolean | Vytvořte výchozí alias pro všechny adresy, výchozí hodnota je `true` (pokud je `true`, použije se jako příjemce e-mailová adresa uživatele API, a pokud je `false`, alias pro všechny adresy se nevytvoří). Pokud je předán řetězec, jedná se o seznam e-mailových adres, které se mají použít jako příjemci (oddělené zalomením řádku, mezerou a/nebo čárkou). |
| `has_adult_content_protection` | Žádný | Boolean | Zda povolit v této doméně ochranu obsahu pro dospělé Spam Scanner |
| `has_phishing_protection` | Žádný | Boolean | Zda povolit ochranu proti phishingu Spam Scanner v této doméně |
| `has_executable_protection` | Žádný | Boolean | Zda povolit spustitelnou ochranu Spam Scanner v této doméně |
| `has_virus_protection` | Žádný | Boolean | Zda povolit antivirovou ochranu Spam Scanner v této doméně |
| `has_recipient_verification` | Žádný | Boolean | Výchozí nastavení globální domény pro to, zda mají příjemci aliasů vyžadovat, aby klikali na odkaz pro ověření e-mailu, aby mohly e-maily procházet |
| `ignore_mx_check` | Žádný | Boolean | Zda ignorovat kontrolu záznamu MX v doméně pro ověření.  Je to hlavně pro uživatele, kteří mají pokročilá pravidla konfigurace výměny MX a potřebují zachovat svou stávající výměnu MX a přeposílat ji naší. |
| `retention_days` | Žádný | Číslo | Celé číslo mezi `0` a `30`, které odpovídá počtu dnů uchovávání odchozích e-mailů SMTP po úspěšném doručení nebo trvalé chybě. Výchozí hodnota je `0`, což znamená, že odchozí e-maily SMTP jsou z bezpečnostních důvodů okamžitě odstraněny a redigovány. |
| `bounce_webhook` | Žádný | Řetězec (URL) nebo logická hodnota (false) | URL adresa webhooku `http://` nebo `https://` dle vašeho výběru, na kterou se mají odesílat webhooky s nedoručitelnou e-mailovou zprávou. Na tuto URL adresu odešleme požadavek `POST` s informacemi o selháních odchozího SMTP (např. měkká nebo tvrdá selhání – abyste mohli spravovat své odběratele a programově spravovat odchozí e-maily). |
| `max_quota_per_alias` | Žádný | Řetězec | Maximální kvóta úložiště pro aliasy na tomto doménovém názvu. Zadejte hodnotu, například „1 GB“, kterou bude analyzovat [bytes](https://github.com/visionmedia/bytes.js). |

> Příklad požadavku:

```sh
curl -X POST BASE_URI/v1/domains \
  -u API_TOKEN: \
  -d domain=DOMAIN_NAME \
  -d plan=free
```

### Načíst doménu {#retrieve-domain}

> `GET /v1/domains/DOMAIN_NAME`

> Příklad požadavku:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME \
  -u API_TOKEN:
```

### Ověření záznamů domény {#verify-domain-records}

> `GET /v1/domains/DOMAIN_NAME/verify-records`

> Příklad požadavku:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/verify-records \
  -u API_TOKEN:
```

### Ověření SMTP záznamů domény {#verify-domain-smtp-records}

> `GET /v1/domains/DOMAIN_NAME/verify-smtp`

> Příklad požadavku:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/verify-smtp \
  -u API_TOKEN:
```

### Zobrazit seznam hesel pro celou doménu {#list-domain-wide-catch-all-passwords}

> `GET /v1/domains/DOMAIN_NAME/catch-all-passwords`

> Příklad požadavku:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/catch-all-passwords \
  -u API_TOKEN:
```

### Vytvořit heslo pro celou doménu {#create-domain-wide-catch-all-password}

> `POST /v1/domains/DOMAIN_NAME/catch-all-passwords`

| Parametr těla | Požadovaný | Typ | Popis |
| -------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new_password` | Žádný | Řetězec | Vaše vlastní nové heslo, které se použije jako univerzální heslo pro celou doménu. Upozorňujeme, že pokud chcete získat náhodně vygenerované a silné heslo, můžete toto pole nechat prázdné nebo jej v těle požadavku API zcela vynechat. |
| `description` | Žádný | Řetězec | Popis pouze pro účely organizace. |

> Příklad požadavku:

```sh
curl BASE_URL/v1/domains/DOMAIN_NAME/catch-all-passwords \
  -u API_TOKEN:
```

### Odebrat heslo pro celou doménu {#remove-domain-wide-catch-all-password}

> `DELETE /v1/domains/DOMAIN_NAME/catch-all-passwords/:token_id`

> Příklad požadavku:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/catch-all-passwords/:token_id \
  -u API_TOKEN:
```

### Aktualizovat doménu {#update-domain}

> `PUT /v1/domains/DOMAIN_NAME`

| Parametr těla | Požadovaný | Typ | Popis |
| ------------------------------ | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smtp_port` | Žádný | Řetězec nebo Číslo | Vlastní port pro konfiguraci pro přesměrování SMTP (výchozí je `"25"`) |
| `has_adult_content_protection` | Žádný | Boolean | Zda povolit v této doméně ochranu obsahu pro dospělé Spam Scanner |
| `has_phishing_protection` | Žádný | Boolean | Zda povolit ochranu proti phishingu Spam Scanner v této doméně |
| `has_executable_protection` | Žádný | Boolean | Zda povolit spustitelnou ochranu Spam Scanner v této doméně |
| `has_virus_protection` | Žádný | Boolean | Zda povolit antivirovou ochranu Spam Scanner v této doméně |
| `has_recipient_verification` | Žádný | Boolean | Výchozí nastavení globální domény pro to, zda mají příjemci aliasů vyžadovat, aby klikali na odkaz pro ověření e-mailu, aby mohly e-maily procházet |
| `ignore_mx_check` | Žádný | Boolean | Zda ignorovat kontrolu záznamu MX v doméně pro ověření.  Je to hlavně pro uživatele, kteří mají pokročilá pravidla konfigurace výměny MX a potřebují zachovat svou stávající výměnu MX a přeposílat ji naší. |
| `retention_days` | Žádný | Číslo | Celé číslo mezi `0` a `30`, které odpovídá počtu dnů uchovávání odchozích e-mailů SMTP po úspěšném doručení nebo trvalé chybě. Výchozí hodnota je `0`, což znamená, že odchozí e-maily SMTP jsou z bezpečnostních důvodů okamžitě odstraněny a redigovány. |
| `bounce_webhook` | Žádný | Řetězec (URL) nebo logická hodnota (false) | URL adresa webhooku `http://` nebo `https://` dle vašeho výběru, na kterou se mají odesílat webhooky s nedoručitelnou e-mailovou zprávou. Na tuto URL adresu odešleme požadavek `POST` s informacemi o selháních odchozího SMTP (např. měkká nebo tvrdá selhání – abyste mohli spravovat své odběratele a programově spravovat odchozí e-maily). |
| `max_quota_per_alias` | Žádný | Řetězec | Maximální kvóta úložiště pro aliasy na tomto doménovém názvu. Zadejte hodnotu, například „1 GB“, kterou bude analyzovat [bytes](https://github.com/visionmedia/bytes.js). |

> Příklad požadavku:

```sh
curl -X PUT BASE_URI/v1/domains/DOMAIN_NAME \
  -u API_TOKEN:
```

### Smazat doménu {#delete-domain}

> `DELETE /v1/domains/:domain_name`

> Příklad požadavku:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name \
  -u API_TOKEN:
```

## Pozvánky {#invites}

### Přijmout pozvánku do domény {#accept-domain-invite}

> `GET /v1/domains/:domain_name/invites`

> Příklad požadavku:

```sh
curl BASE_URI/v1/domains/:domain_name/invites \
  -u API_TOKEN:
```

### Vytvořit pozvánku do domény {#create-domain-invite}

> `POST /v1/domains/DOMAIN_NAME/invites`

| Parametr těla | Požadovaný | Typ | Popis |
| -------------- | -------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `email` | Ano | řetězec (e-mail) | E-mailová adresa pro pozvání do seznamu členů domény |
| `group` | Ano | Řetězec (spočetný) | Skupina, do které se má uživatel přidat do členství v doméně (může být `"admin"` nebo `"user"`) |

> Příklad požadavku:

```sh
curl -X POST BASE_URI/v1/domains/DOMAIN_NAME/invites \
  -u API_TOKEN: \
  -d "email=EMAIL" \
  -d group=admin
```

> \[!IMPORTANT]
> If the user being invited is already an accepted member of any other domains the admin inviting them is a member of, then it will auto-accept the invite and not send an email.

### Odebrat pozvánku z domény {#remove-domain-invite}

> `DELETE /v1/domains/:domain_name/invites`

| Parametr těla | Požadovaný | Typ | Popis |
| -------------- | -------- | -------------- | ------------------------------------------------ |
| `email` | Ano | řetězec (e-mail) | E-mailová adresa, kterou chcete odebrat ze seznamu členů domény |

> Příklad požadavku:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/invites \
  -u API_TOKEN:
```

__CHRÁNĚNÁ_URL_276__ Členové {__CHRÁNĚNÁ_URL_277__

### Aktualizovat člena domény {#update-domain-member}

> `PUT /v1/domains/DOMAIN_NAME/members/MEMBER_ID`

| Parametr těla | Požadovaný | Typ | Popis |
| -------------- | -------- | ------------------- | -------------------------------------------------------------------------------------------- |
| `group` | Ano | Řetězec (spočetný) | Skupina, do které se má uživatele přiřadit k členství v doméně (může být `"admin"` nebo `"user"`) |

> Příklad požadavku:

```sh
curl -X PUT BASE_URI/v1/domains/DOMAIN_NAME/members/MEMBER_ID \
  -u API_TOKEN:
```

### Odebrat člena domény {#remove-domain-member}

> `DELETE /v1/domains/:domain_name/members/:member_id`

> Příklad požadavku:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/members/:member_id \
  -u API_TOKEN:
```

## Aliasy {#aliases}

### Vygenerovat alias hesla {#generate-an-alias-password}

Upozorňujeme, že pokud neodešlete pokyny e-mailem, bude uživatelské jméno a heslo v těle odpovědi JSON úspěšného požadavku ve formátu `{ username: 'alias@yourdomain.com', password: 'some-generated-password' }`.

> `POST /v1/domains/DOMAIN_NAME/aliases/ALIAS_ID/generate-password`

| Parametr těla | Požadovaný | Typ | Popis |
| ---------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new_password` | Žádný | Řetězec | Vaše vlastní nové heslo, které se má použít pro alias.  Pokud si přejete získat náhodně vygenerované a silné heslo, můžete toto pole nechat prázdné nebo zcela chybět v těle požadavku API. |
| `password` | Žádný | Řetězec | Stávající heslo pro alias pro změnu hesla bez smazání stávajícího úložiště poštovní schránky IMAP (pokud již stávající heslo nemáte, viz možnost `is_override` níže). |
| `is_override` | Žádný | Boolean | **POUŽÍVEJTE S POZORNOSTÍ**: Tímto se zcela přepíše stávající heslo a databáze aliasu, trvale se smaže stávající úložiště IMAP a kompletně se resetuje e-mailová databáze SQLite aliasu. Pokud máte k tomuto aliasu připojenou stávající poštovní schránku, vytvořte si prosím zálohu. |
| `emailed_instructions` | Žádný | Řetězec | E-mailová adresa, na kterou bude zasláno heslo aliasu a pokyny k nastavení. |

> Příklad požadavku:

```sh
curl -X POST BASE_URI/v1/domains/DOMAIN_NAME/aliases/ALIAS_ID/generate-password \
  -u API_TOKEN:
```

### Zobrazit aliasy domény {#list-domain-aliases}

> \[!NOTE]
> As of November 1st, 2024 the API endpoints for [List domains](#list-domains) and [List domain aliases](#list-domain-aliases) will default to `1000` max results per page.  If you would like to opt-in to this behavior early, you can pass `?paginate=true` as an additional querystring parameter to the URL for the endpoint query.  See [Pagination](#pagination) for more insight.

> `GET /v1/domains/DOMAIN_NAME/aliases`

| Parametry řetězce dotazů | Požadovaný | Typ | Popis |
| --------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `q` | Žádný | Řetězec (podporováno RegExp) | Vyhledávejte aliasy v doméně podle názvu, štítku nebo příjemce |
| `name` | Žádný | Řetězec (podporováno RegExp) | Vyhledejte aliasy v doméně podle názvu |
| `recipient` | Žádný | Řetězec (podporováno RegExp) | Vyhledejte aliasy v doméně podle příjemce |
| `sort` | Žádný | Řetězec | Seřadit podle konkrétního pole (předpona s jednou pomlčkou `-` se seřadí v opačném směru než toto pole). Pokud není nastaveno, výchozí hodnota je `created_at`. |
| `page` | Žádný | Číslo | Více informací naleznete na [Pagination](#pagination) |
| `limit` | Žádný | Číslo | Více informací naleznete na [Pagination](#pagination) |

> Příklad požadavku:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/aliases?pagination=true \
  -u API_TOKEN:
```

### Vytvořit nový alias domény {#create-new-domain-alias}

> `POST /v1/domains/DOMAIN_NAME/aliases`

| Parametr těla | Požadovaný | Typ | Popis |
| ------------------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` | Žádný | Řetězec | Název aliasu (pokud není zadán nebo je prázdný, vygeneruje se náhodný alias) |
| `recipients` | Žádný | String nebo Array | Seznam příjemců (musí být zalomením řádku/mezera/čárkami oddělený řetězec nebo pole platných e-mailových adres, plně kvalifikovaných názvů domén („FQDN“), IP adres a/nebo webhooků URL – a pokud není zadáno nebo je prázdné pole, bude jako příjemce nastaven e-mail uživatele, který požaduje API) |
| `description` | Žádný | Řetězec | Popis aliasu |
| `labels` | Žádný | String nebo Array | Seznam štítků (musí být řetězec nebo pole oddělené zalomením řádku/mezera/čárkami) |
| `has_recipient_verification` | Žádný | Boolean | Požadovat po příjemcích, aby klikli na odkaz pro ověření e-mailu, aby mohly e-maily projít (výchozí nastavení domény, pokud není výslovně nastaveno v těle požadavku) |
| `is_enabled` | Žádný | Boolean | Zda povolit nebo zakázat tento alias (pokud je zakázán, e-maily nebudou směrovány nikam jinam, ale budou vracet úspěšné stavové kódy). Pokud je předána hodnota, je převedena na booleovskou hodnotu pomocí [boolean](https://github.com/thenativeweb/boolean#quick-start)) |
| `error_code_if_disabled` | Žádný | Číslo (buď `250`, `421` nebo `550`) | Příchozí e-maily na tento alias budou odmítnuty, pokud je `is_enabled` `false` s buď `250` (tiše nedoručovat nikam, např. blackhole nebo `/dev/null`), `421` (měkké odmítnutí; a opakování pokusu až po dobu ~5 dnů) nebo `550` trvalým selháním a odmítnutím. Výchozí nastavení je `250`. |
| `has_imap` | Žádný | Boolean | Zda povolit nebo zakázat úložiště IMAP pro tento alias (pokud je zakázáno, příchozí e-maily nebudou ukládány do [IMAP storage](/blog/docs/best-quantum-safe-encrypted-email-service). Pokud je předána hodnota, je převedena na booleovskou hodnotu pomocí [boolean](https://github.com/thenativeweb/boolean#quick-start)) |
| `has_pgp` | Žádný | Boolean | Zda povolit nebo zakázat [OpenPGP encryption](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd) pro [IMAP/POP3/CalDAV/CardDAV encrypted email storage](/blog/docs/best-quantum-safe-encrypted-email-service) pomocí aliasu `public_key`. |
| `public_key` | Žádný | Řetězec | Veřejný klíč OpenPGP ve formátu ASCII Armor ([click here to view an example](/.well-known/openpgpkey/hu/mxqp8ogw4jfq83a58pn1wy1ccc1cx3f5.txt); např. klíč GPG pro `support@forwardemail.net`). Toto platí pouze v případě, že máte `has_pgp` nastaveno na `true`. [Learn more about end-to-end encryption in our FAQ](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd). |
| `max_quota` | Žádný | Řetězec | Maximální kvóta úložiště pro tento alias. Ponechte prázdné pro reset na aktuální maximální kvótu domény nebo zadejte hodnotu, například „1 GB“, která bude analyzována funkcí [bytes](https://github.com/visionmedia/bytes.js). Tuto hodnotu mohou upravit pouze administrátoři domény. |
| `vacation_responder_is_enabled` | Žádný | Boolean | Zda povolit nebo zakázat automatickou odpověď v nepřítomnosti. |
| `vacation_responder_start_date` | Žádný | Řetězec | Datum zahájení odpovědi na dovolenou (pokud je povoleno a zde není nastaveno datum zahájení, předpokládá se, že již byla spuštěna). Podporujeme formáty data jako `MM/DD/YYYY`, `YYYY-MM-DD` a další formáty data prostřednictvím inteligentní analýzy s využitím `dayjs`. |
| `vacation_responder_end_date` | Žádný | Řetězec | Datum ukončení pro odpověď v době dovolené (pokud je povolena a zde není nastaveno datum ukončení, předpokládá se, že nikdy nekončí a odpovídá navždy). Podporujeme formáty data jako `MM/DD/YYYY`, `YYYY-MM-DD` a další formáty data prostřednictvím inteligentního parsování s použitím `dayjs`. |
| `vacation_responder_subject` | Žádný | Řetězec | Předmět v prostém textu pro odpověď v nepřítomnosti, např. „Mimo kancelář“. K odstranění veškerého HTML kódu zde používáme `striptags`. |
| `vacation_responder_message` | Žádný | Řetězec | Zpráva v prostém textu pro odpověď na dovolenou, např. „Budu mimo kancelář do února.“ K odstranění veškerého HTML kódu zde používáme `striptags`. |

> Příklad požadavku:

```sh
curl -X POST BASE_URI/v1/domains/DOMAIN_NAME/aliases \
  -u API_TOKEN:
```

### Načíst alias domény {#retrieve-domain-alias}

Alias domény můžete načíst buď pomocí jeho hodnoty `id`, nebo pomocí jeho hodnoty `name`.

> `GET /v1/domains/:domain_name/aliases/:alias_id`

> Příklad požadavku:

```sh
curl BASE_URI/v1/domains/:domain_name/aliases/:alias_id \
  -u API_TOKEN:
```

> `GET /v1/domains/:domain_name/aliases/:alias_name`

> Příklad požadavku:

```sh
curl BASE_URI/v1/domains/:domain_name/aliases/:alias_name \
  -u API_TOKEN:
```

### Aktualizovat alias domény {#update-domain-alias}

> `PUT /v1/domains/DOMAIN_NAME/aliases/ALIAS_ID`

| Parametr těla | Požadovaný | Typ | Popis |
| ------------------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` | Žádný | Řetězec | Jméno aliasu |
| `recipients` | Žádný | String nebo Array | Seznam příjemců (musí být zalomením řádku/mezera/čárkou oddělený řetězec nebo pole platných e-mailových adres, plně kvalifikované názvy domén ("FQDN"), IP adresy a/nebo adresy URL webhooku) |
| `description` | Žádný | Řetězec | Popis aliasu |
| `labels` | Žádný | String nebo Array | Seznam štítků (musí být řetězec nebo pole oddělené zalomením řádku/mezera/čárkami) |
| `has_recipient_verification` | Žádný | Boolean | Požadovat po příjemcích, aby klikli na odkaz pro ověření e-mailu, aby mohly e-maily projít (výchozí nastavení domény, pokud není výslovně nastaveno v těle požadavku) |
| `is_enabled` | Žádný | Boolean | Zda povolit nebo zakázat tento alias (pokud je zakázán, e-maily nebudou směrovány nikam jinam, ale budou vracet úspěšné stavové kódy). Pokud je předána hodnota, je převedena na booleovskou hodnotu pomocí [boolean](https://github.com/thenativeweb/boolean#quick-start)) |
| `error_code_if_disabled` | Žádný | Číslo (buď `250`, `421` nebo `550`) | Příchozí e-maily na tento alias budou odmítnuty, pokud je `is_enabled` `false` s buď `250` (tiše nedoručovat nikam, např. blackhole nebo `/dev/null`), `421` (měkké odmítnutí; a opakování pokusu až po dobu ~5 dnů) nebo `550` trvalým selháním a odmítnutím. Výchozí nastavení je `250`. |
| `has_imap` | Žádný | Boolean | Zda povolit nebo zakázat úložiště IMAP pro tento alias (pokud je zakázáno, příchozí e-maily nebudou ukládány do [IMAP storage](/blog/docs/best-quantum-safe-encrypted-email-service). Pokud je předána hodnota, je převedena na booleovskou hodnotu pomocí [boolean](https://github.com/thenativeweb/boolean#quick-start)) |
| `has_pgp` | Žádný | Boolean | Zda povolit nebo zakázat [OpenPGP encryption](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd) pro [IMAP/POP3/CalDAV/CardDAV encrypted email storage](/blog/docs/best-quantum-safe-encrypted-email-service) pomocí aliasu `public_key`. |
| `public_key` | Žádný | Řetězec | Veřejný klíč OpenPGP ve formátu ASCII Armor ([click here to view an example](/.well-known/openpgpkey/hu/mxqp8ogw4jfq83a58pn1wy1ccc1cx3f5.txt); např. klíč GPG pro `support@forwardemail.net`). Toto platí pouze v případě, že máte `has_pgp` nastaveno na `true`. [Learn more about end-to-end encryption in our FAQ](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd). |
| `max_quota` | Žádný | Řetězec | Maximální kvóta úložiště pro tento alias. Ponechte prázdné pro reset na aktuální maximální kvótu domény nebo zadejte hodnotu, například „1 GB“, která bude analyzována funkcí [bytes](https://github.com/visionmedia/bytes.js). Tuto hodnotu mohou upravit pouze administrátoři domény. |
| `vacation_responder_is_enabled` | Žádný | Boolean | Zda povolit nebo zakázat automatickou odpověď v nepřítomnosti. |
| `vacation_responder_start_date` | Žádný | Řetězec | Datum zahájení odpovědi na dovolenou (pokud je povoleno a zde není nastaveno datum zahájení, předpokládá se, že již byla spuštěna). Podporujeme formáty data jako `MM/DD/YYYY`, `YYYY-MM-DD` a další formáty data prostřednictvím inteligentní analýzy s využitím `dayjs`. |
| `vacation_responder_end_date` | Žádný | Řetězec | Datum ukončení pro odpověď v době dovolené (pokud je povolena a zde není nastaveno datum ukončení, předpokládá se, že nikdy nekončí a odpovídá navždy). Podporujeme formáty data jako `MM/DD/YYYY`, `YYYY-MM-DD` a další formáty data prostřednictvím inteligentního parsování s použitím `dayjs`. |
| `vacation_responder_subject` | Žádný | Řetězec | Předmět v prostém textu pro odpověď v nepřítomnosti, např. „Mimo kancelář“. K odstranění veškerého HTML kódu zde používáme `striptags`. |
| `vacation_responder_message` | Žádný | Řetězec | Zpráva v prostém textu pro odpověď na dovolenou, např. „Budu mimo kancelář do února.“ K odstranění veškerého HTML kódu zde používáme `striptags`. |

> Příklad požadavku:

```sh
curl -X PUT BASE_URI/v1/domains/DOMAIN_NAME/aliases/ALIAS_ID \
  -u API_TOKEN:
```

### Smazat alias domény {#delete-domain-alias}

> `DELETE /v1/domains/:domain_name/aliases/:alias_id`

> Příklad požadavku:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/aliases/:alias_id \
  -u API_TOKEN:
```

## Zašifrovat {#encrypt}

Umožňujeme vám šifrovat záznamy i v bezplatném plánu bezplatně. Soukromí by nemělo být funkcí, ale mělo by být neodmyslitelně zabudováno do všech aspektů produktu. Na základě důrazné žádosti v [Diskuse o ochraně osobních údajů](https://discuss.privacyguides.net/t/forward-email-email-provider/13370) a [naše problémy GitHub](https://github.com/forwardemail/forwardemail.net/issues/254) jsme toto přidali.

### Zašifrovat TXT záznam {#encrypt-txt-record}

> `POST /v1/encrypt`

| Parametr těla | Požadovaný | Typ | Popis |
| -------------- | -------- | ------ | -------------------------------------------- |
| `input` | Ano | Řetězec | Jakýkoli platný záznam TXT v prostém textu pro přeposlání e-mailu |

> Příklad požadavku:

```sh
curl -X POST BASE_URI/v1/encrypt \
  -d "input=user@gmail.com"
```
