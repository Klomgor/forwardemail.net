# API электронной почты {#email-api}

## Содержание {#table-of-contents}

* [Библиотеки](#libraries)
* [Базовый URI](#base-uri)
* [Аутентификация](#authentication)
* [Ошибки](#errors)
* [Локализация](#localization)
* [Пагинация](#pagination)
* [Журналы](#logs)
  * [Извлечь журналы](#retrieve-logs)
* [Счет](#account)
  * [Зарегистрироваться](#create-account)
  * [Восстановить учетную запись](#retrieve-account)
  * [Обновить аккаунт](#update-account)
* [Псевдонимы контактов (CardDAV)](#alias-contacts-carddav)
  * [Список контактов](#list-contacts)
  * [Создать контакт](#create-contact)
  * [Восстановить контакт](#retrieve-contact)
  * [Обновить контакт](#update-contact)
  * [Удалить контакт](#delete-contact)
* [Календари псевдонимов (CalDAV)](#alias-calendars-caldav)
  * [Список календарей](#list-calendars)
  * [Создать календарь](#create-calendar)
  * [Получить календарь](#retrieve-calendar)
  * [Обновление календаря](#update-calendar)
  * [Удалить календарь](#delete-calendar)
* [Псевдонимы сообщений (IMAP/POP3)](#alias-messages-imappop3)
  * [Список и поиск сообщений](#list-and-search-for-messages)
  * [Создать сообщение](#create-message)
  * [Получить сообщение](#retrieve-message)
  * [Обновление сообщения](#update-message)
  * [Удалить сообщение](#delete-message)
* [Псевдонимы папок (IMAP/POP3)](#alias-folders-imappop3)
  * [Список папок](#list-folders)
  * [Создать папку](#create-folder)
  * [Восстановить папку](#retrieve-folder)
  * [Обновить папку](#update-folder)
  * [Удалить папку](#delete-folder)
  * [Копировать папку](#copy-folder)
* [Исходящие электронные письма](#outbound-emails)
  * [Получить лимит исходящей электронной почты SMTP](#get-outbound-smtp-email-limit)
  * [Список исходящих писем SMTP](#list-outbound-smtp-emails)
  * [Создать исходящее SMTP-сообщение](#create-outbound-smtp-email)
  * [Получить исходящую SMTP-почту](#retrieve-outbound-smtp-email)
  * [Удалить исходящую SMTP-почту](#delete-outbound-smtp-email)
* [Домены](#domains)
  * [Список доменов](#list-domains)
  * [Создать домен](#create-domain)
  * [Получить домен](#retrieve-domain)
  * [Проверить записи домена](#verify-domain-records)
  * [Проверьте записи SMTP домена](#verify-domain-smtp-records)
  * [Список паролей для всего домена](#list-domain-wide-catch-all-passwords)
  * [Создать универсальный пароль для всего домена](#create-domain-wide-catch-all-password)
  * [Удалить пароль для всего домена](#remove-domain-wide-catch-all-password)
  * [Обновить домен](#update-domain)
  * [Удалить домен](#delete-domain)
* [Приглашения](#invites)
  * [Принять приглашение домена](#accept-domain-invite)
  * [Создать приглашение на домен](#create-domain-invite)
  * [Удалить приглашение домена](#remove-domain-invite)
* [Участники](#members)
  * [Обновление члена домена](#update-domain-member)
  * [Удалить участника домена](#remove-domain-member)
* [Псевдонимы](#aliases)
  * [Сгенерировать пароль псевдонима](#generate-an-alias-password)
  * [Список доменных псевдонимов](#list-domain-aliases)
  * [Создать новый псевдоним домена](#create-new-domain-alias)
  * [Получить псевдоним домена](#retrieve-domain-alias)
  * [Обновить псевдоним домена](#update-domain-alias)
  * [Удалить псевдоним домена](#delete-domain-alias)
* [Шифровать](#encrypt)
  * [Зашифровать TXT-запись](#encrypt-txt-record)

## Библиотеки {#libraries}

На данный момент мы ещё не выпустили API-обёртки, но планируем сделать это в ближайшем будущем. Если вы хотите получать уведомления о выпуске API-обёртки для определённого языка программирования, отправьте письмо на адрес <api@forwardemail.net>. Пока же вы можете использовать эти рекомендуемые библиотеки HTTP-запросов в своём приложении или просто использовать [завиток](https://stackoverflow.com/a/27442239/3586413), как в примерах ниже.

| Язык | Библиотека |
| ---------- | ---------------------------------------------------------------------- |
| Руби | [Faraday](https://github.com/lostisland/faraday) |
| Питон | [requests](https://github.com/psf/requests) |
| Ява | [OkHttp](https://github.com/square/okhttp/) |
| PHP | [guzzle](https://github.com/guzzle/guzzle) |
| JavaScript | [superagent](https://github.com/ladjs/superagent) (мы поддерживаем) |
| Node.js | [superagent](https://github.com/ladjs/superagent) (мы поддерживаем) |
| Идти | [net/http](https://golang.org/pkg/net/http/) |
| .NET | [RestSharp](https://github.com/restsharp/RestSharp) |

## Базовый URI {#base-uri}

Текущий базовый путь HTTP URI: `BASE_URI`.

## Аутентификация {#authentication}

Для всех конечных точек требуется, чтобы [API-ключ](https://forwardemail.net/my-account/security) было установлено в качестве значения «имя пользователя» заголовка [Базовая авторизация](https://en.wikipedia.org/wiki/Basic_access_authentication) запроса (за исключением [Контакты псевдонима](#alias-contacts), [Календари псевдонимов](#alias-calendars) и [Псевдонимы почтовых ящиков](#alias-mailboxes), которые используют [сгенерированный псевдоним имени пользователя и пароля](/faq#do-you-support-receiving-email-with-imap)).

Не волнуйтесь — ниже приведены примеры, если вы не уверены, что это такое.

## Ошибки {#errors}

В случае возникновения ошибок тело ответа на запрос API будет содержать подробное сообщение об ошибке.

| Код | Имя |
| ---- | --------------------- |
| 200 | OK |
| 400 | Плохой запрос |
| 401 | Несанкционированный |
| 403 | Запрещенный |
| 404 | Не найдено |
| 429 | Слишком много запросов |
| 500 | Внутренняя ошибка сервера |
| 501 | Не реализовано |
| 502 | Плохой шлюз |
| 503 | Сервис недоступен |
| 504 | Тайм-аут шлюза |

> \[!TIP]
> If you receive a 5xx status code (which should not happen), then please contact us at <a href="mailto:api@forwardemail.net"><api@forwardemail.net></a> and we will help you to resolve your issue immediately.

## Локализация {#localization}

Наш сервис переведён более чем на 25 языков. Все сообщения ответа API переводятся на последнюю локаль, определённую пользователем, отправившим запрос. Вы можете переопределить это, передав специальный заголовок `Accept-Language`. Попробуйте, используя раскрывающийся список языков внизу этой страницы.

## Пагинация {#pagination}

> \[!NOTE]
> As of November 1st, 2024 the API endpoints for [List domains](#list-domains) and [List domain aliases](#list-domain-aliases) will default to `1000` max results per page.  If you would like to opt-in to this behavior early, you can pass `?paginate=true` as an additional querystring parameter to the URL for the endpoint query.

Пагинация поддерживается всеми конечными точками API, выводящими список результатов.

Просто укажите свойства строки запроса `page` (и при необходимости `limit`).

Свойство `page` должно быть числом, большим или равным `1`. Если вы указываете `limit` (тоже число), то минимальное значение будет `10`, а максимальное — `50` (если не указано иное).

| Параметры строки запроса | Необходимый | Тип | Описание |
| --------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page` | Нет | Число | Страница с результатами для возврата. Если значение не указано, `page` будет равно `1`. Должно быть числом, большим или равным `1`. |
| `limit` | Нет | Число | Количество результатов, возвращаемых на страницу. По умолчанию `10`, если не указано иное. Должно быть числом, большим или равным `1` и меньшим или равным `50`. |

Чтобы определить, доступны ли дополнительные результаты, мы предоставляем следующие заголовки HTTP-ответа (которые можно проанализировать для программной разбивки на страницы):

| Заголовок HTTP-ответа | Пример | Описание |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `X-Page-Count` | `X-Page-Count: 3` | Общее количество доступных страниц. |
| `X-Page-Current` | `X-Page-Current: 1` | Текущая страница возвращаемых результатов (например, на основе параметра строки запроса `page`). |
| `X-Page-Size` | `X-Page-Size: 10` | Общее количество результатов на возвращенной странице (например, на основе параметра строки запроса `limit` и фактических возвращенных результатов). |
| `X-Item-Count` | `X-Item-Count: 30` | Общее количество элементов, доступных на всех страницах. |
| `Link` | `Link: <https://api.forwardemail.net/v1/emails?page=1>; rel="prev", <https://api.forwardemail.net/v1/emails?page=3>; rel="next", <https://api.forwardemail.net/v1/emails?page=3; rel="last", https://api.forwardemail.net/v1/emails?page=1; rel="first"` | Мы предоставляем HTTP-заголовок ответа `Link`, который можно проанализировать, как показано в примере. Это [similar to GitHub](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api#using-link-headers) (например, не все значения будут предоставлены, если они нерелевантны или недоступны, например, `"next"` не будет предоставлен, если нет другой страницы). |

> Пример запроса:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/aliases?page=2&pagination=true \
  -u API_TOKEN:
```

## Журналы {#logs}

### Получить журналы {#retrieve-logs}

Наш API позволяет вам программно загружать журналы вашей учётной записи. Отправка запроса на эту конечную точку обработает все журналы вашей учётной записи и отправит их вам по электронной почте в виде вложения ([Gzip](https://en.wikipedia.org/wiki/Gzip) сжатый файл электронной таблицы [CSV](https://en.wikipedia.org/wiki/Comma-separated_values)).

Это позволяет вам создавать фоновые задания с помощью [Cron-задание](https://en.wikipedia.org/wiki/Cron) или использовать наш [Программное обеспечение для планирования заданий Node.js Бри](https://github.com/breejs/bree) для получения журналов в любое удобное время. Обратите внимание, что эта конечная точка ограничена `10` запросами в день.

Вложение представляет собой строчную форму `email-deliverability-logs-YYYY-MM-DD-h-mm-A-z.csv.gz`, а само письмо содержит краткий обзор полученных журналов. Вы также можете скачать журналы в любое время по ссылке [Моя учетная запись → Журналы](/my-account/logs).

> `GET /v1/logs/download`

| Параметры строки запроса | Необходимый | Тип | Описание |
| --------------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `domain` | Нет | Строка (полное доменное имя) | Фильтровать журналы по полному доменному имени (FQDN). Если вы не укажете его, будут извлечены все журналы по всем доменам. |
| `q` | Нет | Нить | Поиск журналов по адресу электронной почты, домену, псевдониму, IP-адресу или дате (формат `M/Y`, `M/D/YY`, `M-D`, `M-D-YY` или `M.D.YY`). |
| `bounce_category` | Нет | Нить | Поиск журналов по определенной категории отказов (например, `blocklist`). |
| `response_code` | Нет | Число | Поиск журналов по определенному коду ответа об ошибке (например, `421` или `550`). |

> Пример запроса:

```sh
curl BASE_URI/v1/logs/download \
  -u API_TOKEN:
```

> Пример задания Cron (в полночь каждый день):

```sh
0 0 * * * /usr/bin/curl BASE_URI/v1/logs/download -u API_TOKEN: &>/dev/null
```

Обратите внимание, что вы можете использовать такие сервисы, как [Crontab.guru](https://crontab.guru/), для проверки синтаксиса выражений задания cron.

> Пример задания Cron (в полночь каждый день **и с журналами за предыдущий день**):

Для MacOS:

```sh
0 0 * * * /usr/bin/curl BASE_URI/v1/logs/download?q=`date -v-1d -u "+%-m/%-d/%y"` -u API_TOKEN: &>/dev/null
```

Для Linux и Ubuntu:

```sh
0 0 * * * /usr/bin/curl BASE_URI/v1/logs/download?q=`date --date "-1 days" -u "+%-m/%-d/%y"` -u API_TOKEN: &>/dev/null
```

## Учетная запись {#account}

### Создать учетную запись {#create-account}

> `POST /v1/account`

| Параметры тела | Необходимый | Тип | Описание |
| -------------- | -------- | -------------- | ------------- |
| `email` | Да | Строка (Электронная почта) | Адрес электронной почты |
| `password` | Да | Нить | Пароль |

> Пример запроса:

```sh
curl -X POST BASE_URI/v1/account \
  -u API_TOKEN: \
  -d "email=EMAIL"
```

### Восстановить учетную запись {#retrieve-account}

> `GET /v1/account`

> Пример запроса:

```sh
curl BASE_URI/v1/account \
  -u API_TOKEN:
```

### Обновить учетную запись {#update-account}

> `PUT /v1/account`

| Параметры тела | Необходимый | Тип | Описание |
| -------------- | -------- | -------------- | -------------------- |
| `email` | Нет | Строка (Электронная почта) | Адрес электронной почты |
| `given_name` | Нет | Нить | Имя |
| `family_name` | Нет | Нить | Фамилия |
| `avatar_url` | Нет | Строка (URL) | Ссылка на изображение аватара |

> Пример запроса:

```sh
curl -X PUT BASE_URI/v1/account \
  -u API_TOKEN: \
  -d "email=EMAIL"
```

## Псевдонимы контактов (CardDAV) {#alias-contacts-carddav}

> \[!NOTE]
> Unlike other API endpoints, these require [Authentication](#authentication) "username" equal to the alias username and "password" equal to the alias generated password as Basic Authorization headers.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

### Список контактов {#list-contacts}

> `GET /v1/contacts`

**Вскоре**

### Создать контакт {#create-contact}

> `POST /v1/contacts`

**Вскоре**

### Получить контакт {#retrieve-contact}

> `GET /v1/contacts/:id`

**Вскоре**

### Обновить контакт {#update-contact}

> `PUT /v1/contacts/:id`

**Вскоре**

### Удалить контакт {#delete-contact}

> `DELETE /v1/contacts/:id`

**Вскоре**

## Псевдонимы календарей (CalDAV) {#alias-calendars-caldav}

> \[!NOTE]
> Unlike other API endpoints, these require [Authentication](#authentication) "username" equal to the alias username and "password" equal to the alias generated password as Basic Authorization headers.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

### Список календарей {#list-calendars}

> `GET /v1/calendars`

**Вскоре**

### Создать календарь {#create-calendar}

> `POST /v1/calendars`

**Вскоре**

### Получить календарь {#retrieve-calendar}

> `GET /v1/calendars/:id`

**Вскоре**

### Обновление календаря {#update-calendar}

> `PUT /v1/calendars/:id`

**Вскоре**

### Удалить календарь {#delete-calendar}

> `DELETE /v1/calendars/:id`

**Вскоре**

## Сообщения псевдонима (IMAP/POP3) {#alias-messages-imappop3}

> \[!NOTE]
> Unlike other API endpoints, these require [Authentication](#authentication) "username" equal to the alias username and "password" equal to the alias generated password as Basic Authorization headers.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

Убедитесь, что вы выполнили инструкции по настройке вашего домена.

Эти инструкции можно найти в разделе часто задаваемых вопросов [Поддерживаете ли вы получение электронной почты по протоколу IMAP?](/faq#do-you-support-receiving-email-with-imap).

### Список и поиск сообщений {#list-and-search-for-messages}

> `GET /v1/messages`

**Вскоре**

### Создать сообщение {#create-message}

> \[!NOTE]
> This will **NOT** send an email – it will only simply add the message to your mailbox folder (e.g. this is similar to the IMAP `APPEND` command).  If you would like to send an email, then see [Create outbound SMTP email](#create-outbound-smtp-email) below.  After creating the outbound SMTP email, then you can append a copy of it using this endpoint to your alias' mailbox for storage purposes.

> `POST /v1/messages`

**Вскоре**

### Получить сообщение {#retrieve-message}

> `GET /v1/messages/:id`

**Вскоре**

### Обновление сообщения {#update-message}

> `PUT /v1/messages/:id`

**Вскоре**

### Удалить сообщение {#delete-message}

> `DELETE /v1/messages:id`

**Вскоре**

## Псевдонимы папок (IMAP/POP3) {#alias-folders-imappop3}

> \[!TIP]
> Folder endpoints with a folder's path <code>/v1/folders/:path</code> as their endpoint are interchangeable with a folder's ID <code>:id</code>. This means you can refer to the folder by either its <code>path</code> or <code>id</code> value.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

### Список папок {#list-folders}

> `GET /v1/folders`

**Вскоре**

### Создать папку {#create-folder}

> `POST /v1/folders`

**Вскоре**

### Получить папку {#retrieve-folder}

> `GET /v1/folders/:id`

**Вскоре**

### Обновить папку {#update-folder}

> `PUT /v1/folders/:id`

**Вскоре**

### Удалить папку {#delete-folder}

> `DELETE /v1/folders/:id`

**Вскоре**

### Копировать папку {#copy-folder}

> `POST /v1/folders/:id/copy`

**Вскоре**

## Исходящие письма {#outbound-emails}

Убедитесь, что вы выполнили инструкции по настройке вашего домена.

Эти инструкции можно найти по ссылке [Моя учетная запись → Домены → Настройки → Конфигурация исходящего SMTP](/my-account/domains). Вам необходимо настроить DKIM, Return-Path и DMARC для отправки исходящих SMTP-сообщений с вашего домена.

### Получить лимит исходящей SMTP-почты {#get-outbound-smtp-email-limit}

Это простая конечная точка, которая возвращает объект JSON, содержащий `count` и `limit` для количества ежедневных исходящих SMTP-сообщений для каждой учетной записи.

> `GET /v1/emails/limit`

> Пример запроса:

```sh
curl BASE_URI/v1/emails/limit \
  -u API_TOKEN:
```

### Список исходящих писем SMTP {#list-outbound-smtp-emails}

Обратите внимание, что эта конечная точка не возвращает значения свойств для `message`, `headers` или `rejectedErrors` электронного письма.

Чтобы вернуть эти свойства и их значения, используйте конечную точку [Получить электронную почту](#retrieve-email) с идентификатором электронной почты.

> `GET /v1/emails`

| Параметры строки запроса | Необходимый | Тип | Описание |
| --------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `q` | Нет | Строка (поддерживается RegExp) | Поиск писем по метаданным |
| `domain` | Нет | Строка (поддерживается RegExp) | Поиск писем по доменному имени |
| `sort` | Нет | Нить | Сортировка по указанному полю (префикс с одним дефисом `-` используется для сортировки в обратном направлении по этому полю). Если не задано, по умолчанию используется `created_at`. |
| `page` | Нет | Число | Для более подробной информации см. [Pagination](#pagination) |
| `limit` | Нет | Число | Для более подробной информации см. [Pagination](#pagination) |

> Пример запроса:

```sh
curl BASE_URI/v1/emails?limit=1 \
  -u API_TOKEN:
```

### Создать исходящее SMTP-сообщение {#create-outbound-smtp-email}

Наш API для создания электронных писем основан на конфигурации параметров сообщений Nodemailer и использует её. Все параметры тела письма см. по ссылке [Конфигурация сообщения Nodemailer](https://nodemailer.com/message/) ниже.

Обратите внимание, что мы поддерживаем все параметры Nodemailer, за исключением `envelope` и `dkim` (поскольку мы устанавливаем их автоматически). В целях безопасности мы автоматически устанавливаем параметры `disableFileAccess` и `disableUrlAccess` на `true`.

Вам следует либо передать единственный параметр `raw` с вашим необработанным полным письмом, включая заголовки, **или** передать отдельные параметры тела письма ниже.

Эта конечная точка API будет автоматически кодировать эмодзи, если они будут обнаружены в заголовках (например, тема письма `Subject: 🤓 Hello` будет автоматически преобразована в `Subject: =?UTF-8?Q?=F0=9F=A4=93?= Hello`). Нашей целью было создать максимально удобный для разработчиков и защищенный от мошенничества API электронной почты.

> `POST /v1/emails`

| Параметры тела | Необходимый | Тип | Описание |
| ---------------- | -------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from` | Нет | Строка (Электронная почта) | Адрес электронной почты отправителя (должен существовать как псевдоним домена). |
| `to` | Нет | Строка или массив | Список получателей, разделенных запятыми, или массив получателей для заголовка «Кому». |
| `cc` | Нет | Строка или массив | Список получателей, разделенных запятыми, или массив для заголовка «Копия». |
| `bcc` | Нет | Строка или массив | Список получателей, разделенных запятыми, или массив для заголовка «Скрытая копия». |
| `subject` | Нет | Нить | Тема письма. |
| `text` | Нет | Строка или буфер | Текстовая версия сообщения. |
| `html` | Нет | Строка или буфер | HTML-версия сообщения. |
| `attachments` | Нет | Множество | Массив объектов вложений (см. [Nodemailer's common fields](https://nodemailer.com/message/#common-fields)). |
| `sender` | Нет | Нить | Адрес электронной почты для заголовка «Отправитель» (см. [Nodemailer's more advanced fields](https://nodemailer.com/message/#more-advanced-fields)). |
| `replyTo` | Нет | Нить | Адрес электронной почты для заголовка «Ответить». |
| `inReplyTo` | Нет | Нить | Идентификатор сообщения, на которое отправлено сообщение. |
| `references` | Нет | Строка или массив | Список, разделенный пробелами, или массив идентификаторов сообщений. |
| `attachDataUrls` | Нет | Булевое значение | Если `true`, то преобразует изображения `data:` в HTML-содержимом сообщения во встроенные вложения. |
| `watchHtml` | Нет | Нить | HTML-версия сообщения, специфичная для Apple Watch ([according to the Nodemailer docs](https://nodemailer.com/message/#content-options]), для последних моделей часов эта настройка не требуется). |
| `amp` | Нет | Нить | HTML-версия сообщения, специфичная для AMP4EMAIL (см. [Nodemailer's example](https://nodemailer.com/message/#amp-example)). |
| `icalEvent` | Нет | Объект | Событие iCalendar для использования в качестве альтернативного содержимого сообщения (см. [Nodemailer's calendar events](https://nodemailer.com/message/calendar-events/)). |
| `alternatives` | Нет | Множество | Массив альтернативного содержимого сообщения (см. [Nodemailer's alternative content](https://nodemailer.com/message/alternatives/)). |
| `encoding` | Нет | Нить | Кодировка текста и HTML-строк (по умолчанию `"utf-8"`, но также поддерживаются значения кодировки `"hex"` и `"base64"`). |
| `raw` | Нет | Строка или буфер | Специально сгенерированное сообщение в формате RFC822 для использования (вместо сообщения, генерируемого Nodemailer – см. [Nodemailer's custom source](https://nodemailer.com/message/custom-source/)). |
| `textEncoding` | Нет | Нить | Кодировка, которая принудительно используется для текстовых значений (`"quoted-printable"` или `"base64"`). Значение по умолчанию — ближайшее обнаруженное значение (для ASCII используйте `"quoted-printable"`). |
| `priority` | Нет | Нить | Уровень приоритета для электронного письма (может быть `"high"`, `"normal"` (по умолчанию) или `"low"`). Обратите внимание, что значение `"normal"` не устанавливает заголовок приоритета (это поведение по умолчанию). Если установлено значение `"high"` или `"low"`, то заголовки `X-Priority`, `X-MSMail-Priority` и `Importance` будут [will be set accordingly](https://github.com/nodemailer/nodemailer/blob/19fce2dc4dcb83224acaf1cfc890d08126309594/lib/mailer/mail-message.js#L222-L240). |
| `headers` | Нет | Объект или массив | Объект или массив дополнительных полей заголовка для установки (см. [Nodemailer's custom headers](https://nodemailer.com/message/custom-headers/)). |
| `messageId` | Нет | Нить | Необязательное значение Message-ID для заголовка «Message-ID» (если не указано иное, автоматически будет создано значение по умолчанию — обратите внимание, что значение должно быть [adhere to the RFC2822 specification](https://stackoverflow.com/a/4031705)). |
| `date` | Нет | Строка или дата | Необязательное значение даты, которое будет использоваться, если заголовок даты отсутствует после анализа. В противном случае, если он не задан, будет использоваться текущая строка UTC. Заголовок даты не может опережать текущее время более чем на 30 дней. |
| `list` | Нет | Объект | Необязательный объект заголовков `List-*` (см. [Nodemailer's list headers](https://nodemailer.com/message/list-headers/)). |

> Пример запроса:

```sh
curl -X POST BASE_URI/v1/emails \
  -u API_TOKEN: \
  -d "from=alias@DOMAIN_NAME" \
  -d "to=EMAIL" \
  -d "subject=test" \
  -d "text=test"
```

> Пример запроса:

```sh
curl -X POST BASE_URI/v1/emails \
  -u API_TOKEN: \
  -d "raw=`cat file.eml`"
```

### Получить исходящую SMTP-почту {#retrieve-outbound-smtp-email}

> `GET /v1/emails/:id`

> Пример запроса:

```sh
curl BASE_URI/v1/emails/:id \
  -u API_TOKEN:
```

### Удалить исходящее SMTP-сообщение {#delete-outbound-smtp-email}

Удаление письма установит статус `"rejected"` (и впоследствии не будет обрабатываться в очереди) только в том случае, если текущий статус — один из следующих: `"pending"`, `"queued"` или `"deferred"`. Мы можем автоматически удалять письма через 30 дней после их создания и/или отправки, поэтому вам следует сохранять копии исходящих SMTP-сообщений в вашем клиенте, базе данных или приложении. При желании вы можете использовать значение нашего идентификатора электронной почты в вашей базе данных — это значение возвращается как с конечных точек [Создать электронное письмо](#create-email), так и с [Получить электронную почту](#retrieve-email).

> `DELETE /v1/emails/:id`

> Пример запроса:

```sh
curl -X DELETE BASE_URI/v1/emails/:id \
  -u API_TOKEN:
```

## Домены {#domains}

> \[!TIP]
> Domain endpoints with a domain's name <code>/v1/domains/:domain_name</code> as their endpoint are interchangeable with a domain's ID <code>:domain_id</code>. This means you can refer to the domain by either its <code>name</code> or <code>id</code> value.

### Список доменов {#list-domains}

> \[!NOTE]
> As of November 1st, 2024 the API endpoints for [List domains](#list-domains) and [List domain aliases](#list-domain-aliases) will default to `1000` max results per page.  If you would like to opt-in to this behavior early, you can pass `?paginate=true` as an additional querystring parameter to the URL for the endpoint query.  See [Pagination](#pagination) for more insight.

> `GET /v1/domains`

| Параметры строки запроса | Необходимый | Тип | Описание |
| --------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `q` | Нет | Строка (поддерживается RegExp) | Поиск доменов по имени |
| `name` | Нет | Строка (поддерживается RegExp) | Поиск доменов по имени |
| `sort` | Нет | Нить | Сортировка по указанному полю (префикс с одним дефисом `-` используется для сортировки в обратном направлении по этому полю). Если не задано, по умолчанию используется `created_at`. |
| `page` | Нет | Число | Для более подробной информации см. [Pagination](#pagination) |
| `limit` | Нет | Число | Для более подробной информации см. [Pagination](#pagination) |

> Пример запроса:

```sh
curl BASE_URI/v1/domains \
  -u API_TOKEN:
```

### Создать домен {#create-domain}

> `POST /v1/domains`

| Параметры тела | Необходимый | Тип | Описание |
| ------------------------------ | -------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain` | Да | Строка (полное доменное имя или IP) | Полное доменное имя («FQDN») или IP-адрес |
| `team_domain` | Нет | Строка (идентификатор домена или имя домена; полное доменное имя) | Автоматически назначать этот домен той же команде из другого домена. Это означает, что все участники этого домена будут назначены членами команды, а `plan` также будет автоматически установлен на `team`. При необходимости вы можете установить значение `"none"`, чтобы явно отключить эту функцию, но это не обязательно. |
| `plan` | Нет | Строка (перечислимая) | Тип плана (должен быть `"free"`, `"enhanced_protection"` или `"team"`, по умолчанию `"free"` или текущий платный план пользователя, если он подключен) |
| `catchall` | Нет | Строка (разделенные адреса электронной почты) или логическое значение | Создайте псевдоним для сбора всех сообщений по умолчанию, по умолчанию `true` (если `true`, в качестве получателя будет использоваться адрес электронной почты пользователя API, а если `false`, то псевдоним для сбора всех сообщений не будет создан). Если передана строка, то это будет список адресов электронной почты для использования в качестве получателей с разделителями (разделённых переносом строки, пробелом и/или запятой). |
| `has_adult_content_protection` | Нет | Булевое значение | Включать ли защиту от контента для взрослых с помощью Spam Scanner на этом домене? |
| `has_phishing_protection` | Нет | Булевое значение | Включать ли защиту от фишинга Spam Scanner на этом домене? |
| `has_executable_protection` | Нет | Булевое значение | Включать ли защиту исполняемого файла Spam Scanner на этом домене? |
| `has_virus_protection` | Нет | Булевое значение | Включать ли антивирусную защиту Spam Scanner на этом домене? |
| `has_recipient_verification` | Нет | Булевое значение | Глобальное значение по умолчанию для домена, определяющее, требуется ли, чтобы получатели псевдонимов нажимали ссылку для подтверждения адреса электронной почты, чтобы электронные письма проходили через него. |
| `ignore_mx_check` | Нет | Булевое значение | Игнорировать ли проверку MX-записи домена для подтверждения подлинности. Это в основном актуально для пользователей с расширенными правилами настройки обмена MX, которым необходимо сохранить существующий обмен MX и перенаправить трафик на наш. |
| `retention_days` | Нет | Число | Целое число от `0` до `30`, соответствующее количеству дней хранения исходящих SMTP-сообщений после успешной доставки или неустранимой ошибки. Значение по умолчанию — `0`, что означает, что исходящие SMTP-сообщения немедленно удаляются и редактируются в целях вашей безопасности. |
| `bounce_webhook` | Нет | Строка (URL) или логическое значение (false) | URL-адрес веб-перехватчика `http://` или `https://` по вашему выбору для отправки веб-перехватов отказов. Мы отправим запрос `POST` на этот URL-адрес с информацией об исходящих сбоях SMTP (например, о незначительных или существенных сбоях, чтобы вы могли управлять подписчиками и программно управлять исходящей электронной почтой). |
| `max_quota_per_alias` | Нет | Нить | Максимальная квота хранилища для псевдонимов этого доменного имени. Введите значение, например «1 ГБ», которое будет обработано [bytes](https://github.com/visionmedia/bytes.js). |

> Пример запроса:

```sh
curl -X POST BASE_URI/v1/domains \
  -u API_TOKEN: \
  -d domain=DOMAIN_NAME \
  -d plan=free
```

### Получить домен {#retrieve-domain}

> `GET /v1/domains/DOMAIN_NAME`

> Пример запроса:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME \
  -u API_TOKEN:
```

### Проверка записей домена {#verify-domain-records}

> `GET /v1/domains/DOMAIN_NAME/verify-records`

> Пример запроса:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/verify-records \
  -u API_TOKEN:
```

### Проверка записей SMTP домена {#verify-domain-smtp-records}

> `GET /v1/domains/DOMAIN_NAME/verify-smtp`

> Пример запроса:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/verify-smtp \
  -u API_TOKEN:
```

### Список паролей для всего домена {#list-domain-wide-catch-all-passwords}

> `GET /v1/domains/DOMAIN_NAME/catch-all-passwords`

> Пример запроса:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/catch-all-passwords \
  -u API_TOKEN:
```

### Создать пароль для всего домена {#create-domain-wide-catch-all-password}

> `POST /v1/domains/DOMAIN_NAME/catch-all-passwords`

| Параметры тела | Необходимый | Тип | Описание |
| -------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new_password` | Нет | Нить | Ваш новый пользовательский пароль для использования в качестве общедоменного пароля. Обратите внимание, что вы можете оставить это поле пустым или вообще не указывать его в теле запроса API, если хотите получить случайно сгенерированный и надежный пароль. |
| `description` | Нет | Нить | Описание приведено исключительно для организационных целей. |

> Пример запроса:

```sh
curl BASE_URL/v1/domains/DOMAIN_NAME/catch-all-passwords \
  -u API_TOKEN:
```

### Удалить пароль для всех доменов {#remove-domain-wide-catch-all-password}

> `DELETE /v1/domains/DOMAIN_NAME/catch-all-passwords/:token_id`

> Пример запроса:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/catch-all-passwords/:token_id \
  -u API_TOKEN:
```

### Обновить домен {#update-domain}

> `PUT /v1/domains/DOMAIN_NAME`

| Параметры тела | Необходимый | Тип | Описание |
| ------------------------------ | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smtp_port` | Нет | Строка или число | Пользовательский порт для настройки пересылки SMTP (по умолчанию `"25"`) |
| `has_adult_content_protection` | Нет | Булевое значение | Включать ли защиту от контента для взрослых с помощью Spam Scanner на этом домене? |
| `has_phishing_protection` | Нет | Булевое значение | Включать ли защиту от фишинга Spam Scanner на этом домене? |
| `has_executable_protection` | Нет | Булевое значение | Включать ли защиту исполняемого файла Spam Scanner на этом домене? |
| `has_virus_protection` | Нет | Булевое значение | Включать ли антивирусную защиту Spam Scanner на этом домене? |
| `has_recipient_verification` | Нет | Булевое значение | Глобальное значение по умолчанию для домена, определяющее, требуется ли, чтобы получатели псевдонимов нажимали ссылку для подтверждения адреса электронной почты, чтобы электронные письма проходили через него. |
| `ignore_mx_check` | Нет | Булевое значение | Игнорировать ли проверку MX-записи домена для подтверждения подлинности. Это в основном актуально для пользователей с расширенными правилами настройки обмена MX, которым необходимо сохранить существующий обмен MX и перенаправить трафик на наш. |
| `retention_days` | Нет | Число | Целое число от `0` до `30`, соответствующее количеству дней хранения исходящих SMTP-сообщений после успешной доставки или неустранимой ошибки. Значение по умолчанию — `0`, что означает, что исходящие SMTP-сообщения немедленно удаляются и редактируются в целях вашей безопасности. |
| `bounce_webhook` | Нет | Строка (URL) или логическое значение (false) | URL-адрес веб-перехватчика `http://` или `https://` по вашему выбору для отправки веб-перехватов отказов. Мы отправим запрос `POST` на этот URL-адрес с информацией об исходящих сбоях SMTP (например, о незначительных или существенных сбоях, чтобы вы могли управлять подписчиками и программно управлять исходящей электронной почтой). |
| `max_quota_per_alias` | Нет | Нить | Максимальная квота хранилища для псевдонимов этого доменного имени. Введите значение, например «1 ГБ», которое будет обработано [bytes](https://github.com/visionmedia/bytes.js). |

> Пример запроса:

```sh
curl -X PUT BASE_URI/v1/domains/DOMAIN_NAME \
  -u API_TOKEN:
```

### Удалить домен {#delete-domain}

> `DELETE /v1/domains/:domain_name`

> Пример запроса:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name \
  -u API_TOKEN:
```

## Приглашения {#invites}

### Принять приглашение домена {#accept-domain-invite}

> `GET /v1/domains/:domain_name/invites`

> Пример запроса:

```sh
curl BASE_URI/v1/domains/:domain_name/invites \
  -u API_TOKEN:
```

### Создать приглашение на домен {#create-domain-invite}

> `POST /v1/domains/DOMAIN_NAME/invites`

| Параметры тела | Необходимый | Тип | Описание |
| -------------- | -------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `email` | Да | Строка (Электронная почта) | Адрес электронной почты для приглашения в список участников домена |
| `group` | Да | Строка (перечислимая) | Группа, к которой необходимо добавить пользователя для членства в домене (может быть `"admin"` или `"user"`) |

> Пример запроса:

```sh
curl -X POST BASE_URI/v1/domains/DOMAIN_NAME/invites \
  -u API_TOKEN: \
  -d "email=EMAIL" \
  -d group=admin
```

> \[!IMPORTANT]
> If the user being invited is already an accepted member of any other domains the admin inviting them is a member of, then it will auto-accept the invite and not send an email.

### Удалить приглашение домена {#remove-domain-invite}

> `DELETE /v1/domains/:domain_name/invites`

| Параметры тела | Необходимый | Тип | Описание |
| -------------- | -------- | -------------- | ------------------------------------------------ |
| `email` | Да | Строка (Электронная почта) | Адрес электронной почты, который нужно удалить из списка участников домена |

> Пример запроса:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/invites \
  -u API_TOKEN:
```

## Участники {#members}

### Обновление участника домена {#update-domain-member}

> `PUT /v1/domains/DOMAIN_NAME/members/MEMBER_ID`

| Параметры тела | Необходимый | Тип | Описание |
| -------------- | -------- | ------------------- | -------------------------------------------------------------------------------------------- |
| `group` | Да | Строка (перечислимая) | Группа для обновления членства пользователя в домене (может быть `"admin"` или `"user"`) |

> Пример запроса:

```sh
curl -X PUT BASE_URI/v1/domains/DOMAIN_NAME/members/MEMBER_ID \
  -u API_TOKEN:
```

### Удалить участника домена {#remove-domain-member}

> `DELETE /v1/domains/:domain_name/members/:member_id`

> Пример запроса:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/members/:member_id \
  -u API_TOKEN:
```

## Псевдонимы {#aliases}

### Сгенерируйте пароль псевдонима {#generate-an-alias-password}

Обратите внимание: если вы не отправите инструкции по электронной почте, то имя пользователя и пароль будут находиться в теле ответа JSON успешного запроса в формате `{ username: 'alias@yourdomain.com', password: 'some-generated-password' }`.

> `POST /v1/domains/DOMAIN_NAME/aliases/ALIAS_ID/generate-password`

| Параметры тела | Необходимый | Тип | Описание |
| ---------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new_password` | Нет | Нить | Ваш новый пароль для псевдонима. Обратите внимание: вы можете оставить это поле пустым или вообще не указывать его в теле запроса API, если хотите получить случайно сгенерированный и надёжный пароль. |
| `password` | Нет | Нить | Существующий пароль для псевдонима для смены пароля без удаления существующего хранилища почтовых ящиков IMAP (см. параметр `is_override` ниже, если у вас больше нет существующего пароля). |
| `is_override` | Нет | Булевое значение | **ИСПОЛЬЗУЙТЕ С ОСТОРОЖНОСТЬЮ**: Это полностью переопределит существующий пароль и базу данных псевдонима, а также безвозвратно удалит существующее хранилище IMAP и полностью сбросит базу данных электронной почты SQLite псевдонима. Если у вас есть существующий почтовый ящик, привязанный к этому псевдониму, по возможности сделайте резервную копию. |
| `emailed_instructions` | Нет | Нить | Адрес электронной почты, на который необходимо отправить пароль псевдонима и инструкции по настройке. |

> Пример запроса:

```sh
curl -X POST BASE_URI/v1/domains/DOMAIN_NAME/aliases/ALIAS_ID/generate-password \
  -u API_TOKEN:
```

### Список псевдонимов домена {#list-domain-aliases}

> \[!NOTE]
> As of November 1st, 2024 the API endpoints for [List domains](#list-domains) and [List domain aliases](#list-domain-aliases) will default to `1000` max results per page.  If you would like to opt-in to this behavior early, you can pass `?paginate=true` as an additional querystring parameter to the URL for the endpoint query.  See [Pagination](#pagination) for more insight.

> `GET /v1/domains/DOMAIN_NAME/aliases`

| Параметры строки запроса | Необходимый | Тип | Описание |
| --------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `q` | Нет | Строка (поддерживается RegExp) | Поиск псевдонимов в домене по имени, метке или получателю |
| `name` | Нет | Строка (поддерживается RegExp) | Поиск псевдонимов в домене по имени |
| `recipient` | Нет | Строка (поддерживается RegExp) | Поиск псевдонимов в домене по получателю |
| `sort` | Нет | Нить | Сортировка по указанному полю (префикс с одним дефисом `-` используется для сортировки в обратном направлении по этому полю). Если не задано, по умолчанию используется `created_at`. |
| `page` | Нет | Число | Для более подробной информации см. [Pagination](#pagination) |
| `limit` | Нет | Число | Для более подробной информации см. [Pagination](#pagination) |

> Пример запроса:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/aliases?pagination=true \
  -u API_TOKEN:
```

### Создать новый псевдоним домена {#create-new-domain-alias}

> `POST /v1/domains/DOMAIN_NAME/aliases`

| Параметры тела | Необходимый | Тип | Описание |
| ------------------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` | Нет | Нить | Имя псевдонима (если не указано или пусто, то генерируется случайный псевдоним) |
| `recipients` | Нет | Строка или массив | Список получателей (должен представлять собой строку или массив действительных адресов электронной почты, полных доменных имен («FQDN»), IP-адресов и/или URL-адресов веб-перехватчиков, разделенных разрывами строк, пробелами или запятыми. Если список не указан или представляет собой пустой массив, в качестве получателя будет указан адрес электронной почты пользователя, отправившего запрос API) |
| `description` | Нет | Нить | Описание псевдонима |
| `labels` | Нет | Строка или массив | Список меток (должен быть строкой или массивом, разделенным разрывами строки/пробелами/запятыми) |
| `has_recipient_verification` | Нет | Булевое значение | Требовать от получателей нажатия ссылки подтверждения адреса электронной почты для доставки писем (по умолчанию используется настройка домена, если явно не указано иное в тексте запроса) |
| `is_enabled` | Нет | Булевое значение | Включить или отключить этот псевдоним (если отключено, электронные письма не будут перенаправляться, а будут возвращать коды успешного завершения). Если передано значение, оно преобразуется в логическое с помощью [boolean](https://github.com/thenativeweb/boolean#quick-start). |
| `error_code_if_disabled` | Нет | Номер (либо `250`, `421`, либо `550`) | Входящие письма на этот псевдоним будут отклонены, если `is_enabled` — это `false` с `250` (незаметная доставка, например, чёрная дыра или `/dev/null`), `421` (мягкое отклонение; повторные попытки в течение примерно 5 дней) или `550` (постоянная ошибка и отклонение). По умолчанию — `250`. |
| `has_imap` | Нет | Булевое значение | Включить или отключить хранилище IMAP для этого псевдонима (если отключено, то полученные входящие письма не будут сохраняться в [IMAP storage](/blog/docs/best-quantum-safe-encrypted-email-service). Если передается значение, оно преобразуется в логическое значение с помощью [boolean](https://github.com/thenativeweb/boolean#quick-start)) |
| `has_pgp` | Нет | Булевое значение | Включить или отключить [OpenPGP encryption](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd) для [IMAP/POP3/CalDAV/CardDAV encrypted email storage](/blog/docs/best-quantum-safe-encrypted-email-service) с использованием псевдонима `public_key`. |
| `public_key` | Нет | Нить | Открытый ключ OpenPGP в формате ASCII Armor ([click here to view an example](/.well-known/openpgpkey/hu/mxqp8ogw4jfq83a58pn1wy1ccc1cx3f5.txt); например, ключ GPG для `support@forwardemail.net`). Это применимо только в том случае, если `has_pgp` установлен на `true`. [Learn more about end-to-end encryption in our FAQ](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd). |
| `max_quota` | Нет | Нить | Максимальная квота хранилища для этого псевдонима. Оставьте поле пустым, чтобы сбросить до текущей максимальной квоты домена, или введите значение, например, «1 ГБ», которое будет обработано [bytes](https://github.com/visionmedia/bytes.js). Это значение могут изменять только администраторы домена. |
| `vacation_responder_is_enabled` | Нет | Булевое значение | Включить или отключить автоматический автоответчик на время отпуска. |
| `vacation_responder_start_date` | Нет | Нить | Дата начала для автоответчика (если включена и дата начала не указана, то предполагается, что автоответчик уже начал работу). Мы поддерживаем такие форматы дат, как `MM/DD/YYYY`, `YYYY-MM-DD` и другие, благодаря интеллектуальному анализу с использованием `dayjs`. |
| `vacation_responder_end_date` | Нет | Нить | Дата окончания для автоответчика (если включено и дата окончания не задана, то предполагается, что автоответчик никогда не закончится, и автоответчик будет отвечать всегда). Мы поддерживаем такие форматы дат, как `MM/DD/YYYY`, `YYYY-MM-DD` и другие, благодаря интеллектуальному анализу с использованием `dayjs`. |
| `vacation_responder_subject` | Нет | Нить | Тема сообщения в текстовом формате для автоответчика, например, «Нет на месте». Мы используем `striptags` для удаления всего HTML-кода. |
| `vacation_responder_message` | Нет | Нить | Сообщение в виде открытого текста для автоответчика, например: «Меня не будет на работе до февраля». Мы используем `striptags` для удаления всего HTML-кода. |

> Пример запроса:

```sh
curl -X POST BASE_URI/v1/domains/DOMAIN_NAME/aliases \
  -u API_TOKEN:
```

### Получить псевдоним домена {#retrieve-domain-alias}

Получить псевдоним домена можно либо по его значению `id`, либо по его значению `name`.

> `GET /v1/domains/:domain_name/aliases/:alias_id`

> Пример запроса:

```sh
curl BASE_URI/v1/domains/:domain_name/aliases/:alias_id \
  -u API_TOKEN:
```

> `GET /v1/domains/:domain_name/aliases/:alias_name`

> Пример запроса:

```sh
curl BASE_URI/v1/domains/:domain_name/aliases/:alias_name \
  -u API_TOKEN:
```

### Обновить псевдоним домена {#update-domain-alias}

> `PUT /v1/domains/DOMAIN_NAME/aliases/ALIAS_ID`

| Параметры тела | Необходимый | Тип | Описание |
| ------------------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` | Нет | Нить | Псевдоним |
| `recipients` | Нет | Строка или массив | Список получателей (должен представлять собой строку или массив действительных адресов электронной почты, полных доменных имен («FQDN»), IP-адресов и/или URL-адресов веб-перехватчиков, разделенных разрывами строк, пробелами или запятыми) |
| `description` | Нет | Нить | Описание псевдонима |
| `labels` | Нет | Строка или массив | Список меток (должен быть строкой или массивом, разделенным разрывами строки/пробелами/запятыми) |
| `has_recipient_verification` | Нет | Булевое значение | Требовать от получателей нажатия ссылки подтверждения адреса электронной почты для доставки писем (по умолчанию используется настройка домена, если явно не указано иное в тексте запроса) |
| `is_enabled` | Нет | Булевое значение | Включить или отключить этот псевдоним (если отключено, электронные письма не будут перенаправляться, а будут возвращать коды успешного завершения). Если передано значение, оно преобразуется в логическое с помощью [boolean](https://github.com/thenativeweb/boolean#quick-start). |
| `error_code_if_disabled` | Нет | Номер (либо `250`, `421`, либо `550`) | Входящие письма на этот псевдоним будут отклонены, если `is_enabled` — это `false` с `250` (незаметная доставка, например, чёрная дыра или `/dev/null`), `421` (мягкое отклонение; повторные попытки в течение примерно 5 дней) или `550` (постоянная ошибка и отклонение). По умолчанию — `250`. |
| `has_imap` | Нет | Булевое значение | Включить или отключить хранилище IMAP для этого псевдонима (если отключено, то полученные входящие письма не будут сохраняться в [IMAP storage](/blog/docs/best-quantum-safe-encrypted-email-service). Если передается значение, оно преобразуется в логическое значение с помощью [boolean](https://github.com/thenativeweb/boolean#quick-start)) |
| `has_pgp` | Нет | Булевое значение | Включить или отключить [OpenPGP encryption](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd) для [IMAP/POP3/CalDAV/CardDAV encrypted email storage](/blog/docs/best-quantum-safe-encrypted-email-service) с использованием псевдонима `public_key`. |
| `public_key` | Нет | Нить | Открытый ключ OpenPGP в формате ASCII Armor ([click here to view an example](/.well-known/openpgpkey/hu/mxqp8ogw4jfq83a58pn1wy1ccc1cx3f5.txt); например, ключ GPG для `support@forwardemail.net`). Это применимо только в том случае, если `has_pgp` установлен на `true`. [Learn more about end-to-end encryption in our FAQ](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd). |
| `max_quota` | Нет | Нить | Максимальная квота хранилища для этого псевдонима. Оставьте поле пустым, чтобы сбросить до текущей максимальной квоты домена, или введите значение, например, «1 ГБ», которое будет обработано [bytes](https://github.com/visionmedia/bytes.js). Это значение могут изменять только администраторы домена. |
| `vacation_responder_is_enabled` | Нет | Булевое значение | Включить или отключить автоматический автоответчик на время отпуска. |
| `vacation_responder_start_date` | Нет | Нить | Дата начала для автоответчика (если включена и дата начала не указана, то предполагается, что автоответчик уже начал работу). Мы поддерживаем такие форматы дат, как `MM/DD/YYYY`, `YYYY-MM-DD` и другие, благодаря интеллектуальному анализу с использованием `dayjs`. |
| `vacation_responder_end_date` | Нет | Нить | Дата окончания для автоответчика (если включено и дата окончания не задана, то предполагается, что автоответчик никогда не закончится, и автоответчик будет отвечать всегда). Мы поддерживаем такие форматы дат, как `MM/DD/YYYY`, `YYYY-MM-DD` и другие, благодаря интеллектуальному анализу с использованием `dayjs`. |
| `vacation_responder_subject` | Нет | Нить | Тема сообщения в текстовом формате для автоответчика, например, «Нет на месте». Мы используем `striptags` для удаления всего HTML-кода. |
| `vacation_responder_message` | Нет | Нить | Сообщение в виде открытого текста для автоответчика, например: «Меня не будет на работе до февраля». Мы используем `striptags` для удаления всего HTML-кода. |

> Пример запроса:

```sh
curl -X PUT BASE_URI/v1/domains/DOMAIN_NAME/aliases/ALIAS_ID \
  -u API_TOKEN:
```

### Удалить псевдоним домена {#delete-domain-alias}

> `DELETE /v1/domains/:domain_name/aliases/:alias_id`

> Пример запроса:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/aliases/:alias_id \
  -u API_TOKEN:
```

## Зашифровать {#encrypt}

Мы позволяем вам шифровать записи бесплатно даже на бесплатном тарифе. Конфиденциальность не должна быть просто функцией, она должна быть неотъемлемой частью всех аспектов продукта. Мы добавили эту функцию по вашим многочисленным просьбам в [Обсуждение руководств по конфиденциальности](https://discuss.privacyguides.net/t/forward-email-email-provider/13370) и [наши проблемы с GitHub](https://github.com/forwardemail/forwardemail.net/issues/254).

### Зашифровать TXT-запись {#encrypt-txt-record}

> `POST /v1/encrypt`

| Параметры тела | Необходимый | Тип | Описание |
| -------------- | -------- | ------ | -------------------------------------------- |
| `input` | Да | Нить | Любая допустимая запись открытого текста TXT для пересылки электронной почты |

> Пример запроса:

```sh
curl -X POST BASE_URI/v1/encrypt \
  -d "input=user@gmail.com"
```
