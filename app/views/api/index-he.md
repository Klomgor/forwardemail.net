# ממשק API של דוא"ל {#email-api}

תוכן עניינים {##

* [ספריות](#libraries)
* [כתובת URL בסיסית](#base-uri)
* [אימות](#authentication)
* [שגיאות](#errors)
* [לוקליזציה](#localization)
* [דִפּוּף](#pagination)
* [יומני רישום](#logs)
  * [אחזור יומני רישום](#retrieve-logs)
* [חֶשְׁבּוֹן](#account)
  * [צור חשבון](#create-account)
  * [אחזור חשבון](#retrieve-account)
  * [עדכון חשבון](#update-account)
* [אנשי קשר חלופי (CardDAV)](#alias-contacts-carddav)
  * [רשימת אנשי קשר](#list-contacts)
  * [צור איש קשר](#create-contact)
  * [אחזור איש קשר](#retrieve-contact)
  * [עדכון איש קשר](#update-contact)
  * [מחיקת איש קשר](#delete-contact)
* [לוחות שנה חלומיים (CalDAV)](#alias-calendars-caldav)
  * [רשימת לוחות שנה](#list-calendars)
  * [צור לוח שנה](#create-calendar)
  * [אחזור לוח שנה](#retrieve-calendar)
  * [עדכון לוח שנה](#update-calendar)
  * [מחיקת לוח שנה](#delete-calendar)
* [הודעות כינוי (IMAP/POP3)](#alias-messages-imappop3)
  * [רשימת הודעות וחיפושן](#list-and-search-for-messages)
  * [צור הודעה](#create-message)
  * [אחזור הודעה](#retrieve-message)
  * [עדכון הודעה](#update-message)
  * [מחיקת הודעה](#delete-message)
* [תיקיות כינויים (IMAP/POP3)](#alias-folders-imappop3)
  * [רשימת תיקיות](#list-folders)
  * [צור תיקייה](#create-folder)
  * [אחזור תיקייה](#retrieve-folder)
  * [עדכון תיקייה](#update-folder)
  * [מחיקת תיקייה](#delete-folder)
  * [העתקת תיקייה](#copy-folder)
* [מיילים יוצאים](#outbound-emails)
  * [קבל מגבלת דוא"ל SMTP יוצאת](#get-outbound-smtp-email-limit)
  * [רשימת הודעות דוא"ל SMTP יוצאות](#list-outbound-smtp-emails)
  * [צור דוא"ל SMTP יוצא](#create-outbound-smtp-email)
  * [אחזור דוא"ל SMTP יוצא](#retrieve-outbound-smtp-email)
  * [מחיקת דוא"ל SMTP יוצא](#delete-outbound-smtp-email)
* [דומיינים](#domains)
  * [רשימת דומיינים](#list-domains)
  * [צור דומיין](#create-domain)
  * [אחזור דומיין](#retrieve-domain)
  * [אימות רשומות דומיין](#verify-domain-records)
  * [אימות רשומות SMTP של הדומיין](#verify-domain-smtp-records)
  * [רשימת סיסמאות כלליות לכל הדומיין](#list-domain-wide-catch-all-passwords)
  * [צור סיסמה כוללת לכל הדומיין](#create-domain-wide-catch-all-password)
  * [הסר סיסמה כוללת לכל הדומיין](#remove-domain-wide-catch-all-password)
  * [עדכון דומיין](#update-domain)
  * [מחיקת דומיין](#delete-domain)
* [הזמנות](#invites)
  * [קבל את הזמנת הדומיין](#accept-domain-invite)
  * [צור הזמנה לדומיין](#create-domain-invite)
  * [הסר הזמנה לדומיין](#remove-domain-invite)
* [חברים](#members)
  * [עדכון חבר דומיין](#update-domain-member)
  * [הסר חבר דומיין](#remove-domain-member)
* [כינויים](#aliases)
  * [צור סיסמת כינוי](#generate-an-alias-password)
  * [רשימת כינויי דומיין](#list-domain-aliases)
  * [צור כינוי דומיין חדש](#create-new-domain-alias)
  * [אחזור כינוי דומיין](#retrieve-domain-alias)
  * [עדכון כינוי דומיין](#update-domain-alias)
  * [מחיקת כינוי דומיין](#delete-domain-alias)
* [הצפנה](#encrypt)
  * [הצפנת רשומת TXT](#encrypt-txt-record)

## ספריות {#libraries}

כרגע עדיין לא פרסמנו מעטפות API, אך אנו מתכננים לעשות זאת בעתיד הקרוב. שלחו אימייל לכתובת <api@forwardemail.net> אם תרצו לקבל הודעה כאשר מעטפת ה-API של שפת תכנות מסוימת יוצאת. בינתיים, תוכלו להשתמש בספריות בקשות HTTP המומלצות באפליקציה שלכם, או פשוט להשתמש ב-[סִלְסוּל](https://stackoverflow.com/a/27442239/3586413) כמו בדוגמאות שלהלן.

| שָׂפָה | סִפְרִיָה |
| ---------- | ---------------------------------------------------------------------- |
| אוֹדֶם | [Faraday](https://github.com/lostisland/faraday) |
| פִּיתוֹן | [requests](https://github.com/psf/requests) |
| Java | [OkHttp](https://github.com/square/okhttp/) |
| PHP | [guzzle](https://github.com/guzzle/guzzle) |
| JavaScript | [superagent](https://github.com/ladjs/superagent) (אנחנו מתחזקים) |
| Node.js | [superagent](https://github.com/ladjs/superagent) (אנחנו מתחזקים) |
| לָלֶכֶת | [net/http](https://golang.org/pkg/net/http/) |
| .NET | [RestSharp](https://github.com/restsharp/RestSharp) |

## כתובת URL בסיסית {#base-uri}

נתיב ה-URI הבסיסי הנוכחי של HTTP הוא: `BASE_URI`.

## אימות {#authentication}

כל נקודות הקצה דורשות ש-[מפתח API](https://forwardemail.net/my-account/security) שלך יוגדר כערך "שם משתמש" של כותרת [הרשאה בסיסית](https://en.wikipedia.org/wiki/Basic_access_authentication) של הבקשה (למעט [אנשי קשר חלופיים](#alias-contacts), [לוחות שנה חלופיים](#alias-calendars), ו-[תיבות דואר חלופיות](#alias-mailboxes) המשתמשים ב-[שם משתמש וסיסמה כינויים שנוצרו](/faq#do-you-support-receiving-email-with-imap)).

אל דאגה - דוגמאות ניתנות למטה עבורך אם אינך בטוח מה זה.

## שגיאות {#errors}

אם מתרחשות שגיאות כלשהן, גוף התגובה של בקשת ה-API יכיל הודעת שגיאה מפורטת.

| קוד | שֵׁם |
| ---- | --------------------- |
| 200 | OK |
| 400 | בקשה שגויה |
| 401 | לא מורשה |
| 403 | אָסוּר |
| 404 | לא נמצא |
| 429 | יותר מדי בקשות |
| 500 | שגיאת שרת פנימית |
| 501 | לא יושם |
| 502 | שער רע |
| 503 | השירות אינו זמין |
| 504 | פסק זמן של שער הגישה |

> \[!TIP]
> If you receive a 5xx status code (which should not happen), then please contact us at <a href="mailto:api@forwardemail.net"><api@forwardemail.net></a> and we will help you to resolve your issue immediately.

## לוקליזציה {#localization}

השירות שלנו מתורגם ליותר מ-25 שפות שונות. כל הודעות התגובה של ה-API מתורגמות למיקום האחרון שזוהה של המשתמש שביצע את בקשת ה-API. ניתן לעקוף זאת על ידי העברת כותרת מותאמת אישית `Accept-Language`. אל תהססו לנסות זאת באמצעות תפריט השפות הנפתח בתחתית עמוד זה.

## חלוקת דפים {#pagination}

> \[!NOTE]
> As of November 1st, 2024 the API endpoints for [List domains](#list-domains) and [List domain aliases](#list-domain-aliases) will default to `1000` max results per page.  If you would like to opt-in to this behavior early, you can pass `?paginate=true` as an additional querystring parameter to the URL for the endpoint query.

חלוקת עימודים נתמכת על ידי כל נקודות הקצה של ה-API המציגות תוצאות.

פשוט ספקו את מאפייני מחרוזת השאילתה `page` (ואופציונלי `limit`).

המאפיין `page` צריך להיות מספר גדול או שווה ל-`1`. אם תספק `limit` (גם הוא מספר), אז הערך המינימלי הוא `10` והמקסימום הוא `50` (אלא אם כן צוין אחרת).

| פרמטרים של מחרוזת שאילתה | דָרוּשׁ | סוּג | תֵאוּר |
| --------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page` | לֹא | מִספָּר | דף תוצאות להחזרה. אם לא צוין, הערך `page` יהיה `1`. חייב להיות מספר גדול או שווה ל-`1`. |
| `limit` | לֹא | מִספָּר | מספר התוצאות להחזרה בכל עמוד. ברירת המחדל היא `10` אם לא צוין. חייב להיות מספר גדול או שווה ל-`1`, וקטן או שווה ל-`50`. |

על מנת לקבוע האם קיימות תוצאות נוספות, אנו מספקים את כותרות תגובת ה-HTTP הבאות (אותן ניתן לנתח על מנת למיין אותן באופן תכנותי):

| כותרת תגובת HTTP | דוּגמָה | תֵאוּר |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `X-Page-Count` | `X-Page-Count: 3` | מספר העמודים הכולל הזמין. |
| `X-Page-Current` | `X-Page-Current: 1` | דף התוצאות הנוכחי שהוחזר (לדוגמה, בהתבסס על פרמטר מחרוזת השאילתה `page`). |
| `X-Page-Size` | `X-Page-Size: 10` | המספר הכולל של תוצאות שהוחזרו בדף (לדוגמה, בהתבסס על פרמטר מחרוזת השאילתה `limit` והתוצאות בפועל שהוחזרו). |
| `X-Item-Count` | `X-Item-Count: 30` | המספר הכולל של פריטים הזמינים בכל הדפים. |
| `Link` | `Link: <https://api.forwardemail.net/v1/emails?page=1>; rel="prev", <https://api.forwardemail.net/v1/emails?page=3>; rel="next", <https://api.forwardemail.net/v1/emails?page=3; rel="last", https://api.forwardemail.net/v1/emails?page=1; rel="first"` | אנו מספקים כותרת תגובת HTTP `Link` שניתן לנתח כפי שמוצג בדוגמה. זהו [similar to GitHub](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api#using-link-headers) (לדוגמה, לא כל הערכים יסופקו אם הם אינם רלוונטיים או זמינים, לדוגמה, `"next"` לא יסופק אם אין דף נוסף). |

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/aliases?page=2&pagination=true \
  -u API_TOKEN:
```

## יומני רישום {#logs}

### אחזור יומני רישום {#retrieve-logs}

ה-API שלנו מאפשר לך להוריד יומני רישום עבור חשבונך באופן תכנותי. הגשת בקשה לנקודת קצה זו תעבד את כל יומני הרישום עבור חשבונך ותשלח אותם אליך בדוא"ל כקובץ מצורף ([Gzip](https://en.wikipedia.org/wiki/Gzip) קובץ גיליון אלקטרוני דחוס [CSV](https://en.wikipedia.org/wiki/Comma-separated_values)) לאחר השלמת הפעולה.

זה מאפשר לך ליצור עבודות רקע עם [עבודת קרון](https://en.wikipedia.org/wiki/Cron) או להשתמש ב-[תוכנת תזמון משימות Node.js ב-Bree](https://github.com/breejs/bree) שלנו כדי לקבל יומני רישום בכל עת שתרצה. שים לב שנקודת קצה זו מוגבלת ל-`10` בקשות ליום.

הקובץ המצורף הוא באותיות קטנות של `email-deliverability-logs-YYYY-MM-DD-h-mm-A-z.csv.gz` והאימייל עצמו מכיל סיכום קצר של היומנים שאוחזרו. ניתן גם להוריד יומנים בכל עת מ-[החשבון שלי → יומנים](/my-account/logs)

> `GET /v1/logs/download`

| פרמטרים של מחרוזת שאילתה | דָרוּשׁ | סוּג | תֵאוּר |
| --------------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `domain` | לֹא | מחרוזת (FQDN) | סנן יומנים לפי דומיין מלא ("FQDN"). אם לא תספק קוד זה, כל היומנים בכל הדומיינים יאוחזרו. |
| `q` | לֹא | חוּט | חפש יומנים לפי דוא"ל, דומיין, שם כינוי, כתובת IP או תאריך (בפורמט `M/Y`, `M/D/YY`, `M-D`, `M-D-YY` או `M.D.YY`). |
| `bounce_category` | לֹא | חוּט | חפש יומנים לפי קטגוריית יציאה ספציפית (למשל `blocklist`). |
| `response_code` | לֹא | מִספָּר | חפש יומנים לפי קוד תגובת שגיאה ספציפי (למשל `421` או `550`). |

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/logs/download \
  -u API_TOKEN:
```

> דוגמה לעבודת קרון (בחצות כל יום):

```sh
0 0 * * * /usr/bin/curl BASE_URI/v1/logs/download -u API_TOKEN: &>/dev/null
```

שים לב שניתן להשתמש בשירותים כגון [Crontab.guru](https://crontab.guru/) כדי לאמת את תחביר הביטוי של עבודת ה-cron שלך.

> דוגמה לעבודת קרון (בחצות כל יום **ועם יומני רישום ליום הקודם**):

עבור MacOS:

```sh
0 0 * * * /usr/bin/curl BASE_URI/v1/logs/download?q=`date -v-1d -u "+%-m/%-d/%y"` -u API_TOKEN: &>/dev/null
```

עבור לינוקס ואובונטו:

```sh
0 0 * * * /usr/bin/curl BASE_URI/v1/logs/download?q=`date --date "-1 days" -u "+%-m/%-d/%y"` -u API_TOKEN: &>/dev/null
```

## חשבון {#account}

### צור חשבון {#create-account}

> `POST /v1/account`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| -------------- | -------- | -------------- | ------------- |
| `email` | כֵּן | מחרוזת (דוא"ל) | כתובת דוא"ל |
| `password` | כֵּן | חוּט | סִיסמָה |

> בקשה לדוגמה:

```sh
curl -X POST BASE_URI/v1/account \
  -u API_TOKEN: \
  -d "email=EMAIL"
```

### אחזור חשבון {#retrieve-account}

> `GET /v1/account`

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/account \
  -u API_TOKEN:
```

### עדכון חשבון {#update-account}

> `PUT /v1/account`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| -------------- | -------- | -------------- | -------------------- |
| `email` | לֹא | מחרוזת (דוא"ל) | כתובת דוא"ל |
| `given_name` | לֹא | חוּט | שֵׁם פְּרַטִי |
| `family_name` | לֹא | חוּט | שֵׁם מִשׁפָּחָה |
| `avatar_url` | לֹא | מחרוזת (כתובת URL) | קישור לתמונת אווטאר |

> בקשה לדוגמה:

```sh
curl -X PUT BASE_URI/v1/account \
  -u API_TOKEN: \
  -d "email=EMAIL"
```

## אנשי קשר חלופי (CardDAV) {#alias-contacts-carddav}

> \[!NOTE]
> Unlike other API endpoints, these require [Authentication](#authentication) "username" equal to the alias username and "password" equal to the alias generated password as Basic Authorization headers.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

### רשימת אנשי קשר {#list-contacts}

> `GET /v1/contacts`

**בקרוב**

### צור איש קשר {#create-contact}

> `POST /v1/contacts`

**בקרוב**

### אחזור איש קשר {#retrieve-contact}

> `GET /v1/contacts/:id`

**בקרוב**

### עדכון איש קשר {#update-contact}

> `PUT /v1/contacts/:id`

**בקרוב**

### מחק איש קשר {#delete-contact}

> `DELETE /v1/contacts/:id`

**בקרוב**

## לוחות שנה חלוניים (CalDAV) {#alias-calendars-caldav}

> \[!NOTE]
> Unlike other API endpoints, these require [Authentication](#authentication) "username" equal to the alias username and "password" equal to the alias generated password as Basic Authorization headers.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

### רשימת לוחות שנה {#list-calendars}

> `GET /v1/calendars`

**בקרוב**

### צור לוח שנה {#create-calendar}

> `POST /v1/calendars`

**בקרוב**

### אחזור לוח שנה {#retrieve-calendar}

> `GET /v1/calendars/:id`

**בקרוב**

### עדכון לוח שנה {#update-calendar}

> `PUT /v1/calendars/:id`

**בקרוב**

### מחיקת לוח שנה {#delete-calendar}

> `DELETE /v1/calendars/:id`

**בקרוב**

## הודעות כינוי (IMAP/POP3) {#alias-messages-imappop3}

> \[!NOTE]
> Unlike other API endpoints, these require [Authentication](#authentication) "username" equal to the alias username and "password" equal to the alias generated password as Basic Authorization headers.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

אנא ודא שפעלת לפי הוראות ההתקנה עבור הדומיין שלך.

ניתן למצוא הוראות אלה במקטע השאלות הנפוצות שלנו [האם אתם תומכים בקבלת דוא"ל באמצעות IMAP?](/faq#do-you-support-receiving-email-with-imap).

### הצג וחפש הודעות {#list-and-search-for-messages}

> `GET /v1/messages`

**בקרוב**

### צור הודעה {#create-message}

> \[!NOTE]
> This will **NOT** send an email – it will only simply add the message to your mailbox folder (e.g. this is similar to the IMAP `APPEND` command).  If you would like to send an email, then see [Create outbound SMTP email](#create-outbound-smtp-email) below.  After creating the outbound SMTP email, then you can append a copy of it using this endpoint to your alias' mailbox for storage purposes.

> `POST /v1/messages`

**בקרוב**

### אחזור הודעה {#retrieve-message}

> `GET /v1/messages/:id`

**בקרוב**

### הודעת עדכון {#update-message}

> `PUT /v1/messages/:id`

**בקרוב**

### מחק הודעה {#delete-message}

> `DELETE /v1/messages:id`

**בקרוב**

## תיקיות כינויים (IMAP/POP3) {#alias-folders-imappop3}

> \[!TIP]
> Folder endpoints with a folder's path <code>/v1/folders/:path</code> as their endpoint are interchangeable with a folder's ID <code>:id</code>. This means you can refer to the folder by either its <code>path</code> or <code>id</code> value.

> \[!WARNING]
> This endpoint section is a work in progress and will be released (hopefully) in 2024.  In the interim please use an IMAP client from the "Apps" dropdown in the navigation of our website.

### רשימת תיקיות {#list-folders}

> `GET /v1/folders`

**בקרוב**

### צור תיקייה {#create-folder}

> `POST /v1/folders`

**בקרוב**

### אחזור תיקייה {#retrieve-folder}

> `GET /v1/folders/:id`

**בקרוב**

### תיקיית עדכון {#update-folder}

> `PUT /v1/folders/:id`

**בקרוב**

### מחיקת תיקייה {#delete-folder}

> `DELETE /v1/folders/:id`

**בקרוב**

### העתק תיקייה {#copy-folder}

> `POST /v1/folders/:id/copy`

**בקרוב**

## הודעות דוא"ל יוצאות {#outbound-emails}

אנא ודא שפעלת לפי הוראות ההתקנה עבור הדומיין שלך.

ניתן למצוא הוראות אלה בכתובת [החשבון שלי ← דומיינים ← הגדרות ← תצורת SMTP יוצא](/my-account/domains). עליך לוודא הגדרת DKIM, Return-Path ו-DMARC לשליחת SMTP יוצא עם הדומיין שלך.

### קבל מגבלת דוא"ל SMTP יוצאת {#get-outbound-smtp-email-limit}

זוהי נקודת קצה פשוטה שמחזירה אובייקט JSON המכיל את `count` ו-`limit` עבור מספר הודעות ה-SMTP היומיות היומיות על בסיס כל חשבון.

> `GET /v1/emails/limit`

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/emails/limit \
  -u API_TOKEN:
```

### רשימת הודעות דוא"ל יוצאות של SMTP {#list-outbound-smtp-emails}

שים לב שנקודת קצה זו אינה מחזירה ערכי מאפיינים עבור `message`, `headers`, וגם לא `rejectedErrors` של אימייל.

כדי להחזיר מאפיינים אלה והערכים שלהם, אנא השתמש בנקודת הקצה [אחזור דוא"ל](#retrieve-email) עם מזהה דוא"ל.

> `GET /v1/emails`

| פרמטרים של מחרוזת שאילתה | דָרוּשׁ | סוּג | תֵאוּר |
| --------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `q` | לֹא | מחרוזת (נתמכת ב-RegExp) | חיפוש הודעות דוא"ל לפי מטא-נתונים |
| `domain` | לֹא | מחרוזת (נתמכת ב-RegExp) | חיפוש כתובות דוא"ל לפי שם דומיין |
| `sort` | לֹא | חוּט | מיין לפי שדה ספציפי (יש להוסיף קידומת של מקף יחיד `-` כדי למיין בכיוון ההפוך של שדה זה). ברירת המחדל היא `created_at` אם לא מוגדר. |
| `page` | לֹא | מִספָּר | ראה [Pagination](#pagination) לקבלת תובנות נוספות |
| `limit` | לֹא | מִספָּר | ראה [Pagination](#pagination) לקבלת תובנות נוספות |

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/emails?limit=1 \
  -u API_TOKEN:
```

### צור דוא"ל SMTP יוצא {#create-outbound-smtp-email}

ה-API שלנו ליצירת אימייל מושפע וממנף את תצורת אפשרות ההודעה של Nodemailer. אנא עיין ב-[תצורת הודעת Nodemailer](https://nodemailer.com/message/) עבור כל פרמטרי הגוף שלהלן.

שים לב שלמעט `envelope` ו-`dkim` (מכיוון שאנו מגדירים אותם באופן אוטומטי עבורך), אנו תומכים בכל אפשרויות Nodemailer. אנו מגדירים באופן אוטומטי את האפשרויות `disableFileAccess` ו-`disableUrlAccess` ל-`true` לצורכי אבטחה.

עליך להעביר את האפשרות היחידה `raw` עם כתובת האימייל הגולמית המלאה שלך, כולל כותרות, **או** להעביר אפשרויות פרמטר גוף בודדות למטה.

נקודת קצה זו של ה-API תקודד אוטומטית אימוג'ים עבורכם אם הם נמצאים בכותרות (לדוגמה, שורת נושא של `Subject: 🤓 Hello` תומר אוטומטית ל-`Subject: =?UTF-8?Q?=F0=9F=A4=93?= Hello`). המטרה שלנו הייתה ליצור API דוא"ל ידידותי במיוחד למפתחים ועמיד בפני דמה.

> `POST /v1/emails`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| ---------------- | -------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from` | לֹא | מחרוזת (דוא"ל) | כתובת הדוא"ל של השולח (חייבת להתקיים ככינוי של הדומיין). |
| `to` | לֹא | מחרוזת או מערך | רשימה מופרדת בפסיקים או מערך של נמענים עבור כותרת "אל". |
| `cc` | לֹא | מחרוזת או מערך | רשימה מופרדת בפסיקים או מערך של נמענים עבור כותרת "Cc". |
| `bcc` | לֹא | מחרוזת או מערך | רשימה מופרדת בפסיקים או מערך של נמענים עבור כותרת "עותק מוסתר". |
| `subject` | לֹא | חוּט | נושא האימייל. |
| `text` | לֹא | מחרוזת או מאגר | גרסת הטקסט הרגיל של ההודעה. |
| `html` | לֹא | מחרוזת או מאגר | גרסת ה-HTML של ההודעה. |
| `attachments` | לֹא | מַעֲרָך | מערך של אובייקטים מצורפים (ראה [Nodemailer's common fields](https://nodemailer.com/message/#common-fields)). |
| `sender` | לֹא | חוּט | כתובת הדוא"ל עבור כותרת "שולח" (ראה [Nodemailer's more advanced fields](https://nodemailer.com/message/#more-advanced-fields)). |
| `replyTo` | לֹא | חוּט | כתובת הדוא"ל עבור כותרת "השב אל". |
| `inReplyTo` | לֹא | חוּט | מזהה ההודעה שאליו ההודעה היא בתגובה. |
| `references` | לֹא | מחרוזת או מערך | רשימה מופרדת ברווחים או מערך של מזהי הודעות. |
| `attachDataUrls` | לֹא | בוליאני | אם `true` אז `data:` ממיר תמונות בתוכן ה-HTML של ההודעה לקבצים מצורפים מוטמעים. |
| `watchHtml` | לֹא | חוּט | גרסת HTML ספציפית לשעון אפל של ההודעה ([according to the Nodemailer docs](https://nodemailer.com/message/#content-options]), השעונים החדשים ביותר אינם דורשים הגדרה זו). |
| `amp` | לֹא | חוּט | גרסת HTML ספציפית ל-AMP4EMAIL של ההודעה (ראה [Nodemailer's example](https://nodemailer.com/message/#amp-example)). |
| `icalEvent` | לֹא | לְהִתְנַגֵד | אירוע iCalendar לשימוש כתוכן חלופי להודעה (ראה [Nodemailer's calendar events](https://nodemailer.com/message/calendar-events/)). |
| `alternatives` | לֹא | מַעֲרָך | מערך של תוכן הודעה חלופי (ראה [Nodemailer's alternative content](https://nodemailer.com/message/alternatives/)). |
| `encoding` | לֹא | חוּט | קידוד עבור הטקסט ומחרוזות ה-HTML (ברירת המחדל היא `"utf-8"`, אך תומך גם בערכי קידוד `"hex"` ו-`"base64"`). |
| `raw` | לֹא | מחרוזת או מאגר | הודעה בפורמט RFC822 שנוצרה בהתאמה אישית לשימוש (במקום הודעה שנוצרת על ידי Nodemailer – ראה [Nodemailer's custom source](https://nodemailer.com/message/custom-source/)). |
| `textEncoding` | לֹא | חוּט | קידוד שנאלץ לשמש עבור ערכי טקסט (`"quoted-printable"` או `"base64"`). ערך ברירת המחדל הוא הערך הקרוב ביותר שזוהה (עבור ASCII יש להשתמש ב-`"quoted-printable"`). |
| `priority` | לֹא | חוּט | רמת עדיפות עבור האימייל (יכולה להיות `"high"`, `"normal"` (ברירת מחדל), או `"low"`). שים לב שערך של `"normal"` אינו מגדיר כותרת עדיפות (זוהי התנהגות ברירת המחדל). אם מוגדר ערך של `"high"` או `"low"`, אז הכותרות `X-Priority`, `X-MSMail-Priority` ו-`Importance` הן [will be set accordingly](https://github.com/nodemailer/nodemailer/blob/19fce2dc4dcb83224acaf1cfc890d08126309594/lib/mailer/mail-message.js#L222-L240). |
| `headers` | לֹא | אובייקט או מערך | אובייקט או מערך של שדות כותרת נוספים להגדרה (ראה [Nodemailer's custom headers](https://nodemailer.com/message/custom-headers/)). |
| `messageId` | לֹא | חוּט | ערך אופציונלי של מזהה הודעה עבור כותרת "מזהה הודעה" (ערך ברירת מחדל ייווצר אוטומטית אם לא יוגדר – שים לב שהערך צריך להיות [adhere to the RFC2822 specification](https://stackoverflow.com/a/4031705)). |
| `date` | לֹא | מחרוזת או תאריך | ערך תאריך אופציונלי שישמש אם כותרת התאריך חסרה לאחר הניתוח, אחרת מחרוזת UTC הנוכחית תיעשה בשימוש אם לא תוגדר. כותרת התאריך לא יכולה להיות יותר מ-30 יום לפני השעה הנוכחית. |
| `list` | לֹא | לְהִתְנַגֵד | אובייקט אופציונלי של כותרות `List-*` (ראה [Nodemailer's list headers](https://nodemailer.com/message/list-headers/)). |

> בקשה לדוגמה:

```sh
curl -X POST BASE_URI/v1/emails \
  -u API_TOKEN: \
  -d "from=alias@DOMAIN_NAME" \
  -d "to=EMAIL" \
  -d "subject=test" \
  -d "text=test"
```

> בקשה לדוגמה:

```sh
curl -X POST BASE_URI/v1/emails \
  -u API_TOKEN: \
  -d "raw=`cat file.eml`"
```

### אחזור דוא"ל SMTP יוצא {#retrieve-outbound-smtp-email}

> `GET /v1/emails/:id`

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/emails/:id \
  -u API_TOKEN:
```

### מחיקת דוא"ל SMTP יוצא {#delete-outbound-smtp-email}

מחיקת דוא"ל תגדיר את הסטטוס ל-`"rejected"` (ולאחר מכן לא תעבד אותו בתור) אם ורק אם הסטטוס הנוכחי הוא אחד מ-`"pending"`, `"queued"`, או `"deferred"`. אנו עשויים למחוק דוא"ל באופן אוטומטי 30 יום לאחר שנוצרו ו/או נשלחו - לכן עליך לשמור עותק של דוא"ל SMTP יוצא בלקוח, במסד הנתונים או באפליקציה שלך. באפשרותך להתייחס לערך מזהה הדוא"ל שלנו במסד הנתונים שלך אם תרצה בכך - ערך זה מוחזר הן מנקודות הקצה [צור אימייל](#create-email) והן מנקודות הקצה [אחזור דוא"ל](#retrieve-email).

> `DELETE /v1/emails/:id`

> בקשה לדוגמה:

```sh
curl -X DELETE BASE_URI/v1/emails/:id \
  -u API_TOKEN:
```

## דומיינים {#domains}

> \[!TIP]
> Domain endpoints with a domain's name <code>/v1/domains/:domain_name</code> as their endpoint are interchangeable with a domain's ID <code>:domain_id</code>. This means you can refer to the domain by either its <code>name</code> or <code>id</code> value.

### רשימת דומיינים {#list-domains}

> \[!NOTE]
> As of November 1st, 2024 the API endpoints for [List domains](#list-domains) and [List domain aliases](#list-domain-aliases) will default to `1000` max results per page.  If you would like to opt-in to this behavior early, you can pass `?paginate=true` as an additional querystring parameter to the URL for the endpoint query.  See [Pagination](#pagination) for more insight.

> `GET /v1/domains`

| פרמטרים של מחרוזת שאילתה | דָרוּשׁ | סוּג | תֵאוּר |
| --------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `q` | לֹא | מחרוזת (נתמכת ב-RegExp) | חיפוש דומיינים לפי שם |
| `name` | לֹא | מחרוזת (נתמכת ב-RegExp) | חיפוש דומיינים לפי שם |
| `sort` | לֹא | חוּט | מיין לפי שדה ספציפי (יש להוסיף קידומת של מקף יחיד `-` כדי למיין בכיוון ההפוך של שדה זה). ברירת המחדל היא `created_at` אם לא מוגדר. |
| `page` | לֹא | מִספָּר | ראה [Pagination](#pagination) לקבלת תובנות נוספות |
| `limit` | לֹא | מִספָּר | ראה [Pagination](#pagination) לקבלת תובנות נוספות |

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/domains \
  -u API_TOKEN:
```

### צור דומיין {#create-domain}

> `POST /v1/domains`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| ------------------------------ | -------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain` | כֵּן | מחרוזת (FQDN או IP) | שם מתחם מלא ("FQDN") או כתובת IP |
| `team_domain` | לֹא | מחרוזת (מזהה דומיין או שם דומיין; FQDN) | הקצה אוטומטית דומיין זה לאותו צוות מדומיין אחר. משמעות הדבר היא שכל החברים מדומיין זה יוקצו כחברי צוות, וגם ה-`plan` יוגדר אוטומטית ל-`team`. ניתן להגדיר זאת ל-`"none"` במידת הצורך כדי להשבית זאת במפורש, אך אין זה הכרחי. |
| `plan` | לֹא | מחרוזת (ניתנת לספירה) | סוג תוכנית (חייב להיות `"free"`, `"enhanced_protection"`, או `"team"`, ברירת המחדל היא `"free"` או התוכנית בתשלום הנוכחית של המשתמש אם יש כזו) |
| `catchall` | לֹא | מחרוזת (כתובות דוא"ל מופרדות) או מחרוזת בוליאנית | צור כינוי ברירת מחדל של "alias catch-all", ברירת המחדל היא `true` (אם `true` הוא ישתמש בכתובת הדוא"ל של משתמש ה-API כנמען, ואם `false` לא ייווצר כינוי "alias catch-all"). אם מועברת מחרוזת, זוהי רשימה מופרדת של כתובות דוא"ל לשימוש כנמענים (מופרדות באמצעות מעבר שורה, רווח ו/או פסיק). |
| `has_adult_content_protection` | לֹא | בוליאני | האם להפעיל הגנה על תוכן למבוגרים באמצעות סורק ספאם בדומיין זה |
| `has_phishing_protection` | לֹא | בוליאני | האם להפעיל הגנה מפני פישינג באמצעות סורק ספאם בדומיין זה |
| `has_executable_protection` | לֹא | בוליאני | האם להפעיל הגנה על קובץ ההפעלה של סורק ספאם בדומיין זה |
| `has_virus_protection` | לֹא | בוליאני | האם להפעיל את הגנה מפני וירוסים של Spam Scanner בדומיין זה |
| `has_recipient_verification` | לֹא | בוליאני | ברירת מחדל של דומיין גלובלי לשאלה האם לדרוש מנמעני כינוי ללחוץ על קישור אימות דוא"ל כדי שאימיילים יעברו דרכם |
| `ignore_mx_check` | לֹא | בוליאני | האם להתעלם מבדיקת רשומת ה-MX בדומיין לצורך אימות. זה מיועד בעיקר למשתמשים שיש להם כללי תצורה מתקדמים של בורסת MX וצריכים לשמור את בורסת ה-MX הקיימת שלהם ולהעביר אותה לבורסת שלנו. |
| `retention_days` | לֹא | מִספָּר | מספר שלם בין `0` ל-`30` התואם למספר ימי השמירה לאחסון הודעות דוא"ל SMTP יוצאות לאחר שנמסרו בהצלחה או שגיאותיהן קבועות. ברירת המחדל היא `0`, מה שאומר שהודעות דוא"ל SMTP יוצאות נמחקות ונמחקות באופן מיידי למען אבטחתך. |
| `bounce_webhook` | לֹא | מחרוזת (URL) או ערך בוליאני (false) | כתובת האתר `http://` או `https://` לבחירתך לשליחת webhooks חוזרים. נשלח בקשת `POST` לכתובת האתר הזו עם מידע על כשלים יוצאים ב-SMTP (למשל, כשלים רכים או קשים - כך שתוכל לנהל את המנויים שלך ולנהל באופן תכנותי את הדוא"ל היוצא שלך). |
| `max_quota_per_alias` | לֹא | חוּט | מכסת אחסון מקסימלית עבור כינויים בשם דומיין זה. הזן ערך כגון "1 ג'יגה-בייט" שנותח על ידי [bytes](https://github.com/visionmedia/bytes.js). |

> בקשה לדוגמה:

```sh
curl -X POST BASE_URI/v1/domains \
  -u API_TOKEN: \
  -d domain=DOMAIN_NAME \
  -d plan=free
```

### אחזור דומיין {#retrieve-domain}

> `GET /v1/domains/DOMAIN_NAME`

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME \
  -u API_TOKEN:
```

### אימות רשומות דומיין {#verify-domain-records}

> `GET /v1/domains/DOMAIN_NAME/verify-records`

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/verify-records \
  -u API_TOKEN:
```

### אימות רשומות SMTP של הדומיין {#verify-domain-smtp-records}

> `GET /v1/domains/DOMAIN_NAME/verify-smtp`

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/verify-smtp \
  -u API_TOKEN:
```

### רשימת סיסמאות כלליות לכל הדומיין {#list-domain-wide-catch-all-passwords}

> `GET /v1/domains/DOMAIN_NAME/catch-all-passwords`

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/catch-all-passwords \
  -u API_TOKEN:
```

### צור סיסמה כוללת לכל הדומיין {#create-domain-wide-catch-all-password}

> `POST /v1/domains/DOMAIN_NAME/catch-all-passwords`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| -------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new_password` | לֹא | חוּט | סיסמה חדשה מותאמת אישית לשימוש עבור סיסמת הכלל עבור הדומיין. שים לב שתוכל להשאיר שדה זה ריק או חסר לחלוטין מגוף בקשת ה-API שלך אם ברצונך לקבל סיסמה חזקה שנוצרה באופן אקראי. |
| `description` | לֹא | חוּט | תיאור למטרות ארגון בלבד. |

> בקשה לדוגמה:

```sh
curl BASE_URL/v1/domains/DOMAIN_NAME/catch-all-passwords \
  -u API_TOKEN:
```

### הסר סיסמה כוללת של הדומיין {#remove-domain-wide-catch-all-password}

> `DELETE /v1/domains/DOMAIN_NAME/catch-all-passwords/:token_id`

> בקשה לדוגמה:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/catch-all-passwords/:token_id \
  -u API_TOKEN:
```

### עדכון דומיין {#update-domain}

> `PUT /v1/domains/DOMAIN_NAME`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| ------------------------------ | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smtp_port` | לֹא | מחרוזת או מספר | פורט מותאם אישית להגדרה עבור העברת SMTP (ברירת המחדל היא `"25"`) |
| `has_adult_content_protection` | לֹא | בוליאני | האם להפעיל הגנה על תוכן למבוגרים באמצעות סורק ספאם בדומיין זה |
| `has_phishing_protection` | לֹא | בוליאני | האם להפעיל הגנה מפני פישינג באמצעות סורק ספאם בדומיין זה |
| `has_executable_protection` | לֹא | בוליאני | האם להפעיל הגנה על קובץ ההפעלה של סורק ספאם בדומיין זה |
| `has_virus_protection` | לֹא | בוליאני | האם להפעיל את הגנה מפני וירוסים של Spam Scanner בדומיין זה |
| `has_recipient_verification` | לֹא | בוליאני | ברירת מחדל של דומיין גלובלי לשאלה האם לדרוש מנמעני כינוי ללחוץ על קישור אימות דוא"ל כדי שאימיילים יעברו דרכם |
| `ignore_mx_check` | לֹא | בוליאני | האם להתעלם מבדיקת רשומת ה-MX בדומיין לצורך אימות. זה מיועד בעיקר למשתמשים שיש להם כללי תצורה מתקדמים של בורסת MX וצריכים לשמור את בורסת ה-MX הקיימת שלהם ולהעביר אותה לבורסת שלנו. |
| `retention_days` | לֹא | מִספָּר | מספר שלם בין `0` ל-`30` התואם למספר ימי השמירה לאחסון הודעות דוא"ל SMTP יוצאות לאחר שנמסרו בהצלחה או שגיאותיהן קבועות. ברירת המחדל היא `0`, מה שאומר שהודעות דוא"ל SMTP יוצאות נמחקות ונמחקות באופן מיידי למען אבטחתך. |
| `bounce_webhook` | לֹא | מחרוזת (URL) או ערך בוליאני (false) | כתובת האתר `http://` או `https://` לבחירתך לשליחת webhooks חוזרים. נשלח בקשת `POST` לכתובת האתר הזו עם מידע על כשלים יוצאים ב-SMTP (למשל, כשלים רכים או קשים - כך שתוכל לנהל את המנויים שלך ולנהל באופן תכנותי את הדוא"ל היוצא שלך). |
| `max_quota_per_alias` | לֹא | חוּט | מכסת אחסון מקסימלית עבור כינויים בשם דומיין זה. הזן ערך כגון "1 ג'יגה-בייט" שנותח על ידי [bytes](https://github.com/visionmedia/bytes.js). |

> בקשה לדוגמה:

```sh
curl -X PUT BASE_URI/v1/domains/DOMAIN_NAME \
  -u API_TOKEN:
```

### מחיקת דומיין {#delete-domain}

> `DELETE /v1/domains/:domain_name`

> בקשה לדוגמה:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name \
  -u API_TOKEN:
```

## הזמנות {#invites}

### קבל את הזמנת הדומיין {#accept-domain-invite}

> `GET /v1/domains/:domain_name/invites`

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/domains/:domain_name/invites \
  -u API_TOKEN:
```

### צור הזמנה לדומיין {#create-domain-invite}

> `POST /v1/domains/DOMAIN_NAME/invites`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| -------------- | -------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `email` | כֵּן | מחרוזת (דוא"ל) | כתובת דוא"ל להזמנה לרשימת חברי הדומיין |
| `group` | כֵּן | מחרוזת (ניתנת לספירה) | קבוצה להוספת המשתמש לחברות הדומיין (יכולה להיות אחת מ-`"admin"` או `"user"`) |

> בקשה לדוגמה:

```sh
curl -X POST BASE_URI/v1/domains/DOMAIN_NAME/invites \
  -u API_TOKEN: \
  -d "email=EMAIL" \
  -d group=admin
```

> \[!IMPORTANT]
> If the user being invited is already an accepted member of any other domains the admin inviting them is a member of, then it will auto-accept the invite and not send an email.

### הסר הזמנה לדומיין {#remove-domain-invite}

> `DELETE /v1/domains/:domain_name/invites`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| -------------- | -------- | -------------- | ------------------------------------------------ |
| `email` | כֵּן | מחרוזת (דוא"ל) | כתובת דוא"ל להסרה מרשימת חברי הדומיין |

> בקשה לדוגמה:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/invites \
  -u API_TOKEN:
```

## חברים {#members}

### עדכון חבר דומיין {#update-domain-member}

> `PUT /v1/domains/DOMAIN_NAME/members/MEMBER_ID`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| -------------- | -------- | ------------------- | -------------------------------------------------------------------------------------------- |
| `group` | כֵּן | מחרוזת (ניתנת לספירה) | קבוצה לעדכון המשתמש לחברות הדומיין (יכולה להיות אחת מ-`"admin"` או `"user"`) |

> בקשה לדוגמה:

```sh
curl -X PUT BASE_URI/v1/domains/DOMAIN_NAME/members/MEMBER_ID \
  -u API_TOKEN:
```

### הסר חבר דומיין {#remove-domain-member}

> `DELETE /v1/domains/:domain_name/members/:member_id`

> בקשה לדוגמה:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/members/:member_id \
  -u API_TOKEN:
```

## כינויים {#aliases}

### צור סיסמת כינוי {#generate-an-alias-password}

שים לב שאם לא תשלח הוראות בדוא"ל, שם המשתמש והסיסמה יופיעו בגוף תגובת ה-JSON של בקשה מוצלחת בפורמט `{ username: 'alias@yourdomain.com', password: 'some-generated-password' }`.

> `POST /v1/domains/DOMAIN_NAME/aliases/ALIAS_ID/generate-password`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| ---------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new_password` | לֹא | חוּט | סיסמה חדשה מותאמת אישית לשימוש עבור הכינוי. שים לב שתוכל להשאיר שדה זה ריק או חסר לחלוטין מגוף בקשת ה-API שלך אם ברצונך לקבל סיסמה חזקה שנוצרה באופן אקראי. |
| `password` | לֹא | חוּט | סיסמה קיימת עבור כינוי כדי לשנות את הסיסמה מבלי למחוק את אחסון תיבת הדואר הקיימת של IMAP (ראה אפשרות `is_override` להלן אם הסיסמה הקיימת כבר אינה ברשותך). |
| `is_override` | לֹא | בוליאני | **יש להשתמש בזהירות**: פעולה זו תעקוף לחלוטין את סיסמת הכינוי ואת מסד הנתונים הקיימים, ותמחק לצמיתות את אחסון ה-IMAP הקיים ותאפס לחלוטין את מסד הנתונים של הדוא"ל של הכינוי. אנא בצע גיבוי במידת האפשר אם יש לך תיבת דואר קיימת המצורפת לכינוי זה. |
| `emailed_instructions` | לֹא | חוּט | כתובת דוא"ל לשליחת סיסמת הכינוי והוראות הגדרה אליה. |

> בקשה לדוגמה:

```sh
curl -X POST BASE_URI/v1/domains/DOMAIN_NAME/aliases/ALIAS_ID/generate-password \
  -u API_TOKEN:
```

### רשימת שמות דומיין חלופי {#list-domain-aliases}

> \[!NOTE]
> As of November 1st, 2024 the API endpoints for [List domains](#list-domains) and [List domain aliases](#list-domain-aliases) will default to `1000` max results per page.  If you would like to opt-in to this behavior early, you can pass `?paginate=true` as an additional querystring parameter to the URL for the endpoint query.  See [Pagination](#pagination) for more insight.

> `GET /v1/domains/DOMAIN_NAME/aliases`

| פרמטרים של מחרוזת שאילתה | דָרוּשׁ | סוּג | תֵאוּר |
| --------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `q` | לֹא | מחרוזת (נתמכת ב-RegExp) | חיפוש כינויים בדומיין לפי שם, תווית או נמען |
| `name` | לֹא | מחרוזת (נתמכת ב-RegExp) | חיפוש כינויים בדומיין לפי שם |
| `recipient` | לֹא | מחרוזת (נתמכת ב-RegExp) | חיפוש כינויים בדומיין לפי נמען |
| `sort` | לֹא | חוּט | מיין לפי שדה ספציפי (יש להוסיף קידומת של מקף יחיד `-` כדי למיין בכיוון ההפוך של שדה זה). ברירת המחדל היא `created_at` אם לא מוגדר. |
| `page` | לֹא | מִספָּר | ראה [Pagination](#pagination) לקבלת תובנות נוספות |
| `limit` | לֹא | מִספָּר | ראה [Pagination](#pagination) לקבלת תובנות נוספות |

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/domains/DOMAIN_NAME/aliases?pagination=true \
  -u API_TOKEN:
```

### צור כינוי דומיין חדש {#create-new-domain-alias}

> `POST /v1/domains/DOMAIN_NAME/aliases`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| ------------------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` | לֹא | חוּט | שם כינוי (אם לא סופק או אם ריק, נוצר כינוי אקראי) |
| `recipients` | לֹא | מחרוזת או מערך | רשימת נמענים (חייבת להיות מופרדת באמצעות מעבר שורה/רווח/פסיק. מחרוזת או מערך של כתובות דוא"ל חוקיות, שמות מתחם מלאים ("FQDN"), כתובות IP ו/או כתובות URL של webhook – ואם לא סופקו או שמדובר במערך ריק, כתובת הדוא"ל של המשתמש שמבצע את בקשת ה-API תוגדר כנמען) |
| `description` | לֹא | חוּט | תיאור כינוי |
| `labels` | לֹא | מחרוזת או מערך | רשימת תוויות (חייבת להיות מופרדת באמצעות מעבר שורה/רווח/פסיק, מחרוזת או מערך) |
| `has_recipient_verification` | לֹא | בוליאני | דרוש מהנמענים ללחוץ על קישור אימות דוא"ל כדי שאימיילים יעברו דרכם (ברירת המחדל היא הגדרת הדומיין אם לא מוגדרת במפורש בגוף הבקשה) |
| `is_enabled` | לֹא | בוליאני | האם להפעיל או להשבית כינוי זה (אם הוא מושבת, הודעות דוא"ל לא ינותבו לשום מקום אלא יחזירו קודי סטטוס מוצלחים). אם ערך מועבר, הוא מומר לערך בוליאני באמצעות [boolean](https://github.com/thenativeweb/boolean#quick-start)) |
| `error_code_if_disabled` | לֹא | מספר (`250`, `421`, או `550`) | אימייל נכנס לכתובת הכינוי הזו יידחה אם `is_enabled` הוא `false` עם `250` (לשלוח בשקט לשום מקום, למשל חור שחור או `/dev/null`), `421` (דחייה רכה; וניסיון חוזר עד כ-5 ימים) או `550` כישלון ודחייה קבועים. ברירת המחדל היא `250`. |
| `has_imap` | לֹא | בוליאני | האם להפעיל או להשבית אחסון IMAP עבור כינוי זה (אם מושבת, הודעות דוא"ל נכנסות שהתקבלו לא יאוחסנו ב-[IMAP storage](/blog/docs/best-quantum-safe-encrypted-email-service). אם מועבר ערך, הוא מומר לערך בוליאני באמצעות [boolean](https://github.com/thenativeweb/boolean#quick-start)) |
| `has_pgp` | לֹא | בוליאני | האם להפעיל או להשבית את [OpenPGP encryption](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd) עבור [IMAP/POP3/CalDAV/CardDAV encrypted email storage](/blog/docs/best-quantum-safe-encrypted-email-service) באמצעות הכינוי `public_key`. |
| `public_key` | לֹא | חוּט | מפתח ציבורי של OpenPGP בפורמט ASCII Armor ‏([click here to view an example](/.well-known/openpgpkey/hu/mxqp8ogw4jfq83a58pn1wy1ccc1cx3f5.txt); לדוגמה, מפתח GPG עבור `support@forwardemail.net`). זה חל רק אם `has_pgp` מוגדר כ-`true`. [Learn more about end-to-end encryption in our FAQ](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd). |
| `max_quota` | לֹא | חוּט | מכסת אחסון מקסימלית עבור כינוי זה. השאר ריק כדי לאפס למכסת הדומיין המקסימלית הנוכחית או הזן ערך כגון "1 ג'יגה-בייט" שנותח על ידי [bytes](https://github.com/visionmedia/bytes.js). ערך זה ניתן להתאמה רק על ידי מנהלי דומיין. |
| `vacation_responder_is_enabled` | לֹא | בוליאני | האם להפעיל או להשבית משיב חופשה אוטומטי. |
| `vacation_responder_start_date` | לֹא | חוּט | תאריך התחלה עבור משיב חופשה (אם מופעל ולא הוגדר כאן תאריך התחלה, ההנחה היא שהוא כבר התחיל). אנו תומכים בתבניות תאריך כגון `MM/DD/YYYY`, `YYYY-MM-DD`, ובתבניות תאריך אחרות באמצעות ניתוח חכם באמצעות `dayjs`. |
| `vacation_responder_end_date` | לֹא | חוּט | תאריך סיום עבור משיב חופשה (אם מופעל ולא מוגדר כאן תאריך סיום, התוצאה היא שהיא לעולם לא מסתיימת ומגיבה לנצח). אנו תומכים בתבניות תאריך כגון `MM/DD/YYYY`, `YYYY-MM-DD`, ובתבניות תאריך אחרות באמצעות ניתוח חכם באמצעות `dayjs`. |
| `vacation_responder_subject` | לֹא | חוּט | נושא בטקסט רגיל עבור משיב החופשה, לדוגמה "מחוץ למשרד". אנו משתמשים ב-`striptags` כדי להסיר את כל ה-HTML כאן. |
| `vacation_responder_message` | לֹא | חוּט | הודעה בטקסט רגיל עבור משיב החופשה, לדוגמה "אהיה מחוץ למשרד עד פברואר". אנו משתמשים ב-`striptags` כדי להסיר את כל ה-HTML כאן. |

> בקשה לדוגמה:

```sh
curl -X POST BASE_URI/v1/domains/DOMAIN_NAME/aliases \
  -u API_TOKEN:
```

### אחזור כינוי דומיין {#retrieve-domain-alias}

ניתן לאחזר כינוי דומיין לפי הערך `id` שלו או לפי הערך `name` שלו.

> `GET /v1/domains/:domain_name/aliases/:alias_id`

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/domains/:domain_name/aliases/:alias_id \
  -u API_TOKEN:
```

> `GET /v1/domains/:domain_name/aliases/:alias_name`

> בקשה לדוגמה:

```sh
curl BASE_URI/v1/domains/:domain_name/aliases/:alias_name \
  -u API_TOKEN:
```

### עדכון כינוי דומיין {#update-domain-alias}

> `PUT /v1/domains/DOMAIN_NAME/aliases/ALIAS_ID`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| ------------------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` | לֹא | חוּט | שם בדוי |
| `recipients` | לֹא | מחרוזת או מערך | רשימת נמענים (חייבת להיות מופרדת באמצעות מעבר שורה/רווח/פסיק) מחרוזת או מערך של כתובות דוא"ל חוקיות, שמות דומיין מלאים ("FQDN"), כתובות IP ו/או כתובות URL של webhook) |
| `description` | לֹא | חוּט | תיאור כינוי |
| `labels` | לֹא | מחרוזת או מערך | רשימת תוויות (חייבת להיות מופרדת באמצעות מעבר שורה/רווח/פסיק, מחרוזת או מערך) |
| `has_recipient_verification` | לֹא | בוליאני | דרוש מהנמענים ללחוץ על קישור אימות דוא"ל כדי שאימיילים יעברו דרכם (ברירת המחדל היא הגדרת הדומיין אם לא מוגדרת במפורש בגוף הבקשה) |
| `is_enabled` | לֹא | בוליאני | האם להפעיל או להשבית כינוי זה (אם הוא מושבת, הודעות דוא"ל לא ינותבו לשום מקום אלא יחזירו קודי סטטוס מוצלחים). אם ערך מועבר, הוא מומר לערך בוליאני באמצעות [boolean](https://github.com/thenativeweb/boolean#quick-start)) |
| `error_code_if_disabled` | לֹא | מספר (`250`, `421`, או `550`) | אימייל נכנס לכתובת הכינוי הזו יידחה אם `is_enabled` הוא `false` עם `250` (לשלוח בשקט לשום מקום, למשל חור שחור או `/dev/null`), `421` (דחייה רכה; וניסיון חוזר עד כ-5 ימים) או `550` כישלון ודחייה קבועים. ברירת המחדל היא `250`. |
| `has_imap` | לֹא | בוליאני | האם להפעיל או להשבית אחסון IMAP עבור כינוי זה (אם מושבת, הודעות דוא"ל נכנסות שהתקבלו לא יאוחסנו ב-[IMAP storage](/blog/docs/best-quantum-safe-encrypted-email-service). אם מועבר ערך, הוא מומר לערך בוליאני באמצעות [boolean](https://github.com/thenativeweb/boolean#quick-start)) |
| `has_pgp` | לֹא | בוליאני | האם להפעיל או להשבית את [OpenPGP encryption](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd) עבור [IMAP/POP3/CalDAV/CardDAV encrypted email storage](/blog/docs/best-quantum-safe-encrypted-email-service) באמצעות הכינוי `public_key`. |
| `public_key` | לֹא | חוּט | מפתח ציבורי של OpenPGP בפורמט ASCII Armor ‏([click here to view an example](/.well-known/openpgpkey/hu/mxqp8ogw4jfq83a58pn1wy1ccc1cx3f5.txt); לדוגמה, מפתח GPG עבור `support@forwardemail.net`). זה חל רק אם `has_pgp` מוגדר כ-`true`. [Learn more about end-to-end encryption in our FAQ](/faq#do-you-support-openpgpmime-end-to-end-encryption-e2ee-and-web-key-directory-wkd). |
| `max_quota` | לֹא | חוּט | מכסת אחסון מקסימלית עבור כינוי זה. השאר ריק כדי לאפס למכסת הדומיין המקסימלית הנוכחית או הזן ערך כגון "1 ג'יגה-בייט" שנותח על ידי [bytes](https://github.com/visionmedia/bytes.js). ערך זה ניתן להתאמה רק על ידי מנהלי דומיין. |
| `vacation_responder_is_enabled` | לֹא | בוליאני | האם להפעיל או להשבית משיב חופשה אוטומטי. |
| `vacation_responder_start_date` | לֹא | חוּט | תאריך התחלה עבור משיב חופשה (אם מופעל ולא הוגדר כאן תאריך התחלה, ההנחה היא שהוא כבר התחיל). אנו תומכים בתבניות תאריך כגון `MM/DD/YYYY`, `YYYY-MM-DD`, ובתבניות תאריך אחרות באמצעות ניתוח חכם באמצעות `dayjs`. |
| `vacation_responder_end_date` | לֹא | חוּט | תאריך סיום עבור משיב חופשה (אם מופעל ולא מוגדר כאן תאריך סיום, התוצאה היא שהיא לעולם לא מסתיימת ומגיבה לנצח). אנו תומכים בתבניות תאריך כגון `MM/DD/YYYY`, `YYYY-MM-DD`, ובתבניות תאריך אחרות באמצעות ניתוח חכם באמצעות `dayjs`. |
| `vacation_responder_subject` | לֹא | חוּט | נושא בטקסט רגיל עבור משיב החופשה, לדוגמה "מחוץ למשרד". אנו משתמשים ב-`striptags` כדי להסיר את כל ה-HTML כאן. |
| `vacation_responder_message` | לֹא | חוּט | הודעה בטקסט רגיל עבור משיב החופשה, לדוגמה "אהיה מחוץ למשרד עד פברואר". אנו משתמשים ב-`striptags` כדי להסיר את כל ה-HTML כאן. |

> בקשה לדוגמה:

```sh
curl -X PUT BASE_URI/v1/domains/DOMAIN_NAME/aliases/ALIAS_ID \
  -u API_TOKEN:
```

### מחיקת כינוי דומיין {#delete-domain-alias}

> `DELETE /v1/domains/:domain_name/aliases/:alias_id`

> בקשה לדוגמה:

```sh
curl -X DELETE BASE_URI/v1/domains/:domain_name/aliases/:alias_id \
  -u API_TOKEN:
```

## הצפנה {#encrypt}

אנו מאפשרים לך להצפין רשומות אפילו בתוכנית החינמית ללא עלות. פרטיות לא צריכה להיות תכונה, היא צריכה להיות מובנית באופן אינהרנטי בכל היבטי המוצר. כפי שמתבקש מאוד ב-[דיון על מדריכי פרטיות](https://discuss.privacyguides.net/t/forward-email-email-provider/13370) וב-[בעיות הגיטהאב שלנו](https://github.com/forwardemail/forwardemail.net/issues/254) הוספנו זאת.

### הצפנת רשומת TXT {#encrypt-txt-record}

> `POST /v1/encrypt`

| פרמטר גוף | דָרוּשׁ | סוּג | תֵאוּר |
| -------------- | -------- | ------ | -------------------------------------------- |
| `input` | כֵּן | חוּט | כל רשומת טקסט טקסט רגיל תקפה להעברת דוא"ל |

> בקשה לדוגמה:

```sh
curl -X POST BASE_URI/v1/encrypt \
  -d "input=user@gmail.com"
```
