# Listmonk z funkcją przekazywania wiadomości e-mail w celu bezpiecznego dostarczania newsletterów {#listmonk-with-forward-email-for-secure-newsletter-delivery}

## Spis treści {#table-of-contents}

* [Przegląd](#overview)
* [Dlaczego Listmonk i Forward Email](#why-listmonk-and-forward-email)
* [Wymagania wstępne](#prerequisites)
* [Instalacja](#installation)
  * [1. Zaktualizuj swój serwer](#1-update-your-server)
  * [2. Zainstaluj zależności](#2-install-dependencies)
  * [3. Pobierz konfigurację Listmonk](#3-download-listmonk-configuration)
  * [4. Skonfiguruj zaporę sieciową (UFW)](#4-configure-firewall-ufw)
  * [5. Skonfiguruj dostęp HTTPS](#5-configure-https-access)
  * [6. Uruchom Listmonk](#6-start-listmonk)
  * [7. Skonfiguruj przekierowanie poczty e-mail SMTP w Listmonk](#7-configure-forward-email-smtp-in-listmonk)
  * [8. Skonfiguruj przetwarzanie odrzuceń](#8-configure-bounce-processing)
* [Testowanie](#testing)
  * [Utwórz listę mailingową](#create-a-mailing-list)
  * [Dodaj subskrybentów](#add-subscribers)
  * [Utwórz i wyślij kampanię](#create-and-send-a-campaign)
* [Weryfikacja](#verification)
* [Notatki dla programistów](#developer-notes)
* [Wniosek](#conclusion)

## Przegląd {#overview}

Ten przewodnik zawiera instrukcje krok po kroku dla programistów dotyczące konfiguracji [Listmonk](https://listmonk.app/), potężnego menedżera newsletterów i list mailingowych typu open source, z wykorzystaniem [Przekaż dalej e-mail](https://forwardemail.net/) jako dostawcy SMTP. Taka kombinacja pozwala efektywnie zarządzać kampaniami, zapewniając jednocześnie bezpieczne, prywatne i niezawodne dostarczanie wiadomości e-mail.

* **Listmonk**: Obsługuje zarządzanie subskrybentami, organizację list, tworzenie kampanii i śledzenie wydajności.

* **Forward Email**: Działa jako bezpieczny serwer SMTP, obsługujący faktyczne wysyłanie wiadomości e-mail z wbudowanymi funkcjami bezpieczeństwa, takimi jak SPF, DKIM, DMARC i szyfrowanie TLS.

Integrując te dwa rozwiązania, zachowujesz pełną kontrolę nad swoimi danymi i infrastrukturą, wykorzystując jednocześnie niezawodny system dostarczania wiadomości e-mail Forward Email.

## Dlaczego Listmonk i przekazywanie wiadomości e-mail {#why-listmonk-and-forward-email}

* **Open Source**: Zarówno Listmonk, jak i zasady stojące za Forward Email kładą nacisk na przejrzystość i kontrolę. Sam hostujesz Listmonk, będąc właścicielem swoich danych.

* **Skupiony na prywatności**: Forward Email został zbudowany z myślą o prywatności w centrum, minimalizując retencję danych i skupiając się na bezpiecznej transmisji.

* **Opłacalność**: Listmonk jest bezpłatny, a Forward Email oferuje hojne bezpłatne poziomy i niedrogie płatne plany, co czyni go przyjaznym dla budżetu rozwiązaniem.

* **Skalowalność**: Listmonk jest wysoce wydajny, a infrastruktura Forward Email jest zaprojektowana do niezawodnej dostawy na dużą skalę.

* **Przyjazny dla deweloperów**: Listmonk oferuje solidne API, a Forward Email zapewnia prostą integrację SMTP i webhooki.

## Wymagania wstępne {#prerequisites}

Zanim zaczniesz, upewnij się, że masz następujące rzeczy:

* Wirtualny serwer prywatny (VPS) z najnowszą dystrybucją Linuksa (zalecany Ubuntu 20.04+) z co najmniej jednym procesorem i 1 GB pamięci RAM (zalecane 2 GB).
* Potrzebujesz dostawcy? Sprawdź [zalecana lista VPS](https://github.com/forwardemail/awesome-mail-server-providers).
* Nazwa domeny, którą kontrolujesz (wymagany dostęp DNS).
* Aktywne konto z [Przekaż dalej e-mail](https://forwardemail.net/).
* Dostęp root lub `sudo` do Twojego VPS.
* Podstawowa znajomość operacji wiersza poleceń Linuksa.

## Instalacja {#installation}

Poniższe kroki przeprowadzą Cię przez proces instalacji Listmonk za pomocą Dockera i Docker Compose na Twoim VPS.

### 1. Zaktualizuj swój serwer {#1-update-your-server}

Upewnij się, że lista pakietów w Twoim systemie oraz zainstalowane pakiety są aktualne.

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Zainstaluj zależności {#2-install-dependencies}

Zainstaluj Docker, Docker Compose i UFW (Uncomplicated Firewall).

```bash
sudo apt install -y docker.io docker-compose ufw
```

### 3. Pobierz konfigurację Listmonk {#3-download-listmonk-configuration}

Utwórz katalog dla Listmonk i pobierz oficjalny plik `docker-compose.yml`.

```bash
mkdir listmonk && cd listmonk
curl -Lo docker-compose.yml https://raw.githubusercontent.com/knadh/listmonk/master/docker-compose.yml
```

Ten plik definiuje kontener aplikacji Listmonk i wymagany kontener bazy danych PostgreSQL.

### 4. Skonfiguruj zaporę sieciową (UFW) {#4-configure-firewall-ufw}

Zezwól na niezbędny ruch (SSH, HTTP, HTTPS) przez zaporę. Jeśli Twój SSH działa na niestandardowym porcie, dostosuj odpowiednio.

```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

Po wyświetleniu monitu potwierdź włączenie zapory.

### 5. Konfigurowanie dostępu HTTPS {#5-configure-https-access}

Uruchomienie Listmonk przez HTTPS jest kluczowe dla bezpieczeństwa. Masz dwie podstawowe opcje:

#### Opcja A: Korzystanie z serwera proxy Cloudflare (zalecane ze względu na prostotę) {#option-a-using-cloudflare-proxy-recommended-for-simplicity}

Jeśli obsługą DNS Twojej domeny zajmuje się Cloudflare, możesz wykorzystać ich funkcję proxy, aby łatwo nawiązać połączenie HTTPS.

1. **Wskaż DNS**: Utwórz rekord `A` w Cloudflare dla swojej subdomeny Listmonk (np. `listmonk.yourdomain.com`) wskazujący na adres IP Twojego VPS. Upewnij się, że **Status proxy** jest ustawiony na **Zalogowany** (pomarańczowa chmurka).
2. **Modyfikuj Docker Compose**: Edytuj pobrany plik `docker-compose.yml`:
```bash
   sed -i 's/9000:9000/80:9000/' docker-compose.yml
   ```
Dzięki temu Listmonk będzie dostępny wewnętrznie na porcie 80, który Cloudflare może następnie przekierować do proxy i zabezpieczyć za pomocą protokołu HTTPS.

#### Opcja B: Korzystanie z odwrotnego serwera proxy (Nginx, Caddy itp.) {#option-b-using-a-reverse-proxy-nginx-caddy-etc}

Alternatywą jest skonfigurowanie odwrotnego serwera proxy, takiego jak Nginx lub Caddy na Twoim VPS, który będzie obsługiwał zakończenie protokołu HTTPS i żądania proxy kierowane do Listmonk (domyślnie działającego na porcie 9000).

* Zachowaj domyślny `ports: - "127.0.0.1:9000:9000"` w `docker-compose.yml`, aby zapewnić dostęp do Listmonka tylko lokalnie.
* Skonfiguruj wybrany serwer proxy odwrotnego tak, aby nasłuchiwał na portach 80 i 443, obsługiwał pozyskiwanie certyfikatów SSL (np. za pośrednictwem Let's Encrypt) i przekierowywał ruch do `http://127.0.0.1:9000`.
* Szczegółowa konfiguracja serwera proxy odwrotnego wykracza poza zakres tego przewodnika, ale wiele samouczków jest dostępnych online.

### 6. Uruchom Listmonk {#6-start-listmonk}

Wróć do katalogu `listmonk` (jeśli jeszcze tam nie jesteś) i uruchom kontenery w trybie odłączonym.

```bash
cd ~/listmonk # Or the directory where you saved docker-compose.yml
docker compose up -d
```

Docker pobierze niezbędne obrazy i uruchomi aplikację Listmonk oraz kontenery bazy danych. Za pierwszym razem może to potrwać minutę lub dwie.

✅ **Dostęp do Listmonk**: Teraz powinieneś mieć możliwość uzyskania dostępu do interfejsu internetowego Listmonk za pośrednictwem skonfigurowanej domeny (np. `https://listmonk.yourdomain.com`).

### 7. Skonfiguruj przekierowanie poczty e-mail SMTP w Listmonk {#7-configure-forward-email-smtp-in-listmonk}

Następnie skonfiguruj Listmonk tak, aby wysyłał wiadomości e-mail za pomocą konta Forward Email.

1. **Włącz SMTP w przekierowaniu poczty**: Upewnij się, że wygenerowałeś dane uwierzytelniające SMTP w panelu konta przekierowania poczty. Postępuj zgodnie z instrukcjami [Przewodnik Forward Email dotyczący wysyłania wiadomości e-mail z niestandardową domeną za pośrednictwem SMTP](https://forwardemail.net/en/guides/send-email-with-custom-domain-smtp), jeśli jeszcze tego nie zrobiłeś.
2. **Skonfiguruj Listmonk**: Zaloguj się do panelu administracyjnego Listmonk.
* Przejdź do **Ustawienia -> SMTP**.

* Listmonk ma wbudowaną obsługę Forward Email. Wybierz **ForwardEmail** z listy dostawców lub ręcznie wprowadź następujące szczegóły:

| Ustawienie | Wartość |
| :---------------- | :------------------------------------------------------------------------------------------------------------------ |
| **Gospodarz** | `smtp.forwardemail.net` |
| **Port** | `465` |
| **Protokół uwierzytelniania** | `LOGIN` |
| **Nazwa użytkownika** | Twoja wiadomość e-mail **Nazwa użytkownika SMTP** |
| **Hasło** | Twoje hasło do poczty elektronicznej **Hasło SMTP** |
| **TLS** | `SSL/TLS` |
| **Z e-maila** | Twój pożądany adres `From` (np. `newsletter@yourdomain.com`). Upewnij się, że ta domena jest skonfigurowana w funkcji przekazywania wiadomości e-mail. |

* **Ważne**: Zawsze używaj portu `465` z `SSL/TLS` do bezpiecznych połączeń z funkcją Forward Email. Nie używaj protokołu STARTTLS (port 587).

* Kliknij **Zapisz**.
3. **Wyślij e-mail testowy**: Użyj przycisku „Wyślij e-mail testowy” na stronie ustawień SMTP. Wprowadź adres odbiorcy, do którego masz dostęp, i kliknij **Wyślij**. Sprawdź, czy e-mail dotarł do skrzynki odbiorczej odbiorcy.

### 8. Konfigurowanie przetwarzania zwrotów {#8-configure-bounce-processing}

Przetwarzanie odrzuceń pozwala Listmonk na automatyczne przetwarzanie wiadomości e-mail, których nie można było dostarczyć (np. z powodu nieprawidłowych adresów). Forward Email udostępnia webhook do powiadamiania Listmonk o odrzuceniach.

#### Przekaż dalej konfigurację poczty e-mail {#forward-email-setup}

1. Zaloguj się do [Panel przesyłania wiadomości e-mail](https://forwardemail.net/).
2. Przejdź do sekcji **Domeny**, wybierz domenę, której używasz do wysyłania wiadomości i przejdź do jej strony **Ustawienia**.
3. Przewiń w dół do sekcji **Adres URL webhooka Bounce**.
4. Wprowadź poniższy adres URL, zastępując `<your_listmonk_domain>` rzeczywistą domeną lub subdomeną, w której dostępna jest Twoja instancja Listmonk:
```sh
   https://<your_listmonk_domain>/webhooks/service/forwardemail
   ```
*Przykład*: `https://listmonk.yourdomain.com/webhooks/service/forwardemail`
5. Przewiń w dół do sekcji **Klucz weryfikacji danych podpisu webhooka**.
6. **Skopiuj** wygenerowany klucz weryfikacyjny. Będzie potrzebny w Listmonk.
7. Zapisz zmiany w ustawieniach domeny przekierowania poczty e-mail.

#### Konfiguracja Listmonka {#listmonk-setup}

1. W panelu administracyjnym Listmonk przejdź do **Ustawienia -> Odsyłanie**.
2. Włącz opcję **Włącz przetwarzanie odsyłania**.
3. Włącz opcję **Włącz webhooki odsyłania**.
4. Przewiń w dół do sekcji **Dostawcy webhooków**.
5. Włącz opcję **Przekazuj e-maile**.
6. Wklej **Klucz weryfikacji podpisu webhooka** skopiowany z pulpitu nawigacyjnego Przekazuj e-maile w pole **Klucz przekazu e-mail**.
7. Kliknij **Zapisz** na dole strony.
8. Przetwarzanie odsyłania jest teraz skonfigurowane! Gdy funkcja Przekazuj e-maile wykryje odsyłanie wiadomości e-mail wysłanych przez Listmonk, powiadomi ona Twoją instancję Listmonk za pośrednictwem webhooka, a Listmonk odpowiednio oznaczy subskrybenta.
9. Wykonaj poniższe kroki w [Testowanie](#testing), aby upewnić się, że wszystko działa poprawnie.

## Testowanie {#testing}

Oto krótki przegląd podstawowych funkcji Listmonk:

### Utwórz listę mailingową {#create-a-mailing-list}

* Przejdź do **Listy** na pasku bocznym.
* Kliknij **Nowa lista**.
* Wypełnij szczegóły (Nazwa, Typ: Publiczna/Prywatna, Opis, Tagi) i **Zapisz**.

### Dodaj subskrybentów {#add-subscribers}

* Przejdź do sekcji **Subskrybenci**.
* Możesz dodać subskrybentów:
* **Ręcznie**: Kliknij **Nowy subskrybent**.
* **Import**: Kliknij **Importuj subskrybentów**, aby przesłać plik CSV.
* **API**: Użyj API Listmonk do dodawania programowego.
* Przypisz subskrybentów do jednej lub więcej list podczas tworzenia lub importowania.
* **Najlepsza praktyka**: Użyj procesu podwójnego opt-in. Skonfiguruj to w **Ustawienia -> Opt-in i subskrypcje**.

### Utwórz i wyślij kampanię {#create-and-send-a-campaign}

* Przejdź do **Kampanie** -> **Nowa kampania**.
* Uzupełnij szczegóły kampanii (nazwa, temat, adres e-mail od odbiorcy, lista(y) do wysłania).
* Wybierz typ treści (Rich Text/HTML, zwykły tekst, Raw HTML).
* Utwórz treść e-maila. Możesz użyć zmiennych szablonu, takich jak `{{ .Subscriber.Email }}` lub `{{ .Subscriber.FirstName }}`.
* **Zawsze najpierw wyślij e-mail testowy!** Użyj opcji „Wyślij test”, aby wyświetlić podgląd wiadomości w skrzynce odbiorczej.
* Po zakończeniu kliknij **Rozpocznij kampanię**, aby wysłać ją natychmiast lub zaplanować na później.

## Weryfikacja {#verification}

* **Dostarczanie SMTP**: Regularnie wysyłaj testowe wiadomości e-mail za pośrednictwem strony ustawień SMTP w Listmonk i testuj kampanie, aby upewnić się, że wiadomości są dostarczane poprawnie.
* **Obsługa zwrotów**: Wyślij testową kampanię na znany, nieprawidłowy adres e-mail (np. `bounce-test@yourdomain.com`, jeśli nie masz pod ręką prawdziwego adresu, choć wyniki mogą się różnić). Po chwili sprawdź statystyki kampanii w Listmonk, aby upewnić się, że zwrot został zarejestrowany.
* **Nagłówki wiadomości e-mail**: Użyj narzędzi takich jak [Tester poczty](https://www.mail-tester.com/) lub ręcznie sprawdź nagłówki wiadomości e-mail, aby upewnić się, że SPF, DKIM i DMARC są poprawne, co wskazuje na poprawną konfigurację funkcji przekazywania wiadomości e-mail.
* **Dzienniki przekazywania wiadomości e-mail**: Sprawdź dzienniki panelu przekazywania wiadomości e-mail, jeśli podejrzewasz problemy z dostarczaniem wiadomości pochodzące z serwera SMTP.

## Notatki dla programistów {#developer-notes}

* **Szablony**: Listmonk korzysta z silnika szablonów Go. Zapoznaj się z dokumentacją, aby uzyskać dostęp do zaawansowanej personalizacji: `{{ .Subscriber.Attribs.your_custom_field }}`.
* **API**: Listmonk oferuje kompleksowe API REST do zarządzania listami, subskrybentami, kampaniami, szablonami i nie tylko. Link do dokumentacji API znajdziesz w stopce swojej instancji Listmonk.
* **Pola niestandardowe**: Zdefiniuj pola niestandardowe subskrybentów w **Ustawienia -> Pola subskrybentów**, aby przechowywać dodatkowe dane.
* **Webhooki**: Oprócz odrzuceń, Listmonk może wysyłać webhooki dla innych zdarzeń (np. subskrypcji), umożliwiając integrację z innymi systemami.

## Wnioski {#conclusion}

Integrując samodzielnie hostowaną moc Listmonk z bezpieczną, respektującą prywatność dostawą Forward Email, tworzysz solidną i etyczną platformę marketingu e-mailowego. Zachowujesz pełną własność danych odbiorców, jednocześnie korzystając z wysokiej dostarczalności i zautomatyzowanych funkcji bezpieczeństwa.

Taka konfiguracja zapewnia skalowalną, opłacalną i przyjazną dla deweloperów alternatywę dla zastrzeżonych usług poczty e-mail, doskonale wpisując się w ideę oprogramowania typu open source i prywatność użytkowników.

Szczęśliwego wysyłania! 🚀