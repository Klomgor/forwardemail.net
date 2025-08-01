# ส่งต่ออีเมล: โซลูชันการส่งต่ออีเมลที่สอดคล้องกับมาตรา 889 ของคุณ {#forward-email-your-section-889-compliant-email-forwarding-solution}

<img loading="lazy" src="/img/articles/federal.webp" alt="" class="rounded-lg" />

## สารบัญ {#table-of-contents}

* [คำนำ](#foreword)
* [ทำความเข้าใจเกี่ยวกับการปฏิบัติตามมาตรา 889](#understanding-section-889-compliance)
* [อีเมลส่งต่อบรรลุผลตามมาตรา 889 ได้อย่างไร](#how-forward-email-achieves-section-889-compliance)
  * [ความมุ่งมั่นของ Cloudflare](#cloudflares-commitment)
  * [โครงสร้างพื้นฐานของ DataPacket](#datapackets-infrastructure)
* [เกินกว่ามาตรา 889: การปฏิบัติตามข้อกำหนดของรัฐบาลที่กว้างขวางยิ่งขึ้น](#beyond-section-889-broader-government-compliance)
* [เส้นทางข้างหน้าของเรา: ขยายขอบเขตการปฏิบัติตามกฎระเบียบ](#our-path-forward-expanding-compliance-horizons)
* [เหตุใดสิ่งนี้จึงสำคัญสำหรับคุณ](#why-this-matters-for-you)
* [การส่งต่ออีเมลที่ปลอดภัยและเป็นไปตามข้อกำหนดเริ่มต้นที่นี่](#secure-compliant-email-forwarding-starts-here)
* [อ้างอิง](#references)

## คำนำ {#foreword}

ที่ Forward Email เราเชื่อมั่นในการส่งต่ออีเมลที่เรียบง่าย ปลอดภัย และเป็นส่วนตัวสำหรับทุกคน เราทราบดีว่าสำหรับองค์กรหลายแห่ง โดยเฉพาะอย่างยิ่งองค์กรที่ทำงานร่วมกับรัฐบาลสหรัฐอเมริกา การปฏิบัติตามข้อกำหนดไม่ใช่แค่คำฮิตติดปาก แต่เป็นสิ่งจำเป็น การปฏิบัติตาม **กฎระเบียบของรัฐบาลกลางเกี่ยวกับอีเมล** เป็นสิ่งสำคัญอย่างยิ่ง ด้วยเหตุนี้ เราจึงภูมิใจที่จะยืนยันว่าบริการ **การส่งต่ออีเมลที่ปลอดภัย** ของเราถูกสร้างขึ้นเพื่อให้เป็นไปตามข้อกำหนดที่เข้มงวดของรัฐบาลกลาง ซึ่งรวมถึง [มาตรา 889](https://www.acquisition.gov/Section-889-Policies) ของ [พระราชบัญญัติการอนุญาตการป้องกันประเทศ (NDAA)](https://en.wikipedia.org/wiki/National_Defense_Authorization_Act)

ความมุ่งมั่นของเราในการปฏิบัติตามข้อกำหนดด้านอีเมลของรัฐบาลได้ถูกนำมาใช้จริงเมื่อเร็วๆ นี้ เมื่อ **วิทยาลัยนายเรือสหรัฐฯ** ได้ติดต่อ **ส่งต่ออีเมล** พวกเขาต้องการบริการ **ส่งต่ออีเมลที่ปลอดภัย** และต้องการเอกสารยืนยันการปฏิบัติตามกฎระเบียบของรัฐบาลกลาง ซึ่งรวมถึง **การปฏิบัติตามมาตรา 889** ประสบการณ์นี้เป็นกรณีศึกษาที่มีคุณค่า แสดงให้เห็นถึงความพร้อมและความสามารถของเราในการสนับสนุนองค์กรที่ได้รับทุนสนับสนุนจากรัฐบาลและปฏิบัติตามข้อกำหนดที่เข้มงวด ความมุ่งมั่นนี้ครอบคลุมถึงผู้ใช้ทุกคนของเราที่กำลังมองหาโซลูชันอีเมลที่เชื่อถือได้และ **มุ่งเน้นความเป็นส่วนตัว**

## ทำความเข้าใจเกี่ยวกับการปฏิบัติตามมาตรา 889 {#understanding-section-889-compliance}

มาตรา 889 คืออะไร? พูดง่ายๆ ก็คือ กฎหมายของรัฐบาลกลางสหรัฐฯ ที่ห้ามไม่ให้หน่วยงานรัฐบาลใช้หรือทำสัญญากับหน่วยงานที่ใช้บริการหรืออุปกรณ์โทรคมนาคมและการเฝ้าระวังวิดีโอบางประเภทจากบริษัทเฉพาะ (เช่น Huawei, ZTE, Hikvision, Dahua และ Hytera) กฎนี้ ซึ่งมักเกี่ยวข้องกับการแบน Huawei และ ZTE ช่วยปกป้องความมั่นคงของชาติ

> \[!NOTE]
> มาตรา 889 มุ่งเป้าไปที่อุปกรณ์และบริการจาก Huawei, ZTE, Hytera, Hikvision และ Dahua รวมถึงบริษัทสาขาและบริษัทในเครือโดยเฉพาะ

สำหรับ **บริการส่งต่ออีเมลสำหรับสัญญารัฐบาล** เช่น **การส่งต่ออีเมล** นี้หมายถึงการทำให้แน่ใจว่าผู้ให้บริการโครงสร้างพื้นฐานพื้นฐานของเราจะไม่ใช้เครื่องมือต้องห้ามนี้ ซึ่งจะทำให้เรา **ปฏิบัติตามมาตรา 889**

## วิธีที่อีเมลส่งต่อบรรลุผลตามมาตรา 889 {#how-forward-email-achieves-section-889-compliance}

แล้ว **การส่งต่ออีเมลเป็นไปตามมาตรา 889 ได้อย่างไร** เราบรรลุเป้าหมายนี้ได้ด้วยการคัดเลือกพันธมิตรด้านโครงสร้างพื้นฐานอย่างรอบคอบ **การส่งต่ออีเมล** อาศัยผู้ให้บริการหลักสองรายสำหรับ **โครงสร้างพื้นฐานที่เป็นไปตามมาตรา 889**:

1. **[คลาวด์แฟลร์](https://www.cloudflare.com/):** พันธมิตรหลักของเราสำหรับบริการเครือข่ายและ **ความปลอดภัยอีเมล Cloudflare**
2. **[ดาต้าแพ็คเก็ต](https://datapacket.com/):** ผู้ให้บริการหลักของเราสำหรับโครงสร้างพื้นฐานเซิร์ฟเวอร์ (เราใช้ [มหาสมุทรดิจิทัล](https://www.digitalocean.com/) และ/หรือ [วัลเตอร์](https://www.vultr.com/) สำหรับ Failover และเร็วๆ นี้จะเปลี่ยนไปใช้ DataPacket เท่านั้น – แน่นอนว่าเราได้ยืนยันการปฏิบัติตามมาตรา 889 เป็นลายลักษณ์อักษรจากผู้ให้บริการ Failover ทั้งสองรายนี้แล้ว)

> \[!IMPORTANT]
> การที่เราพึ่งพา Cloudflare และ DataPacket แต่เพียงผู้เดียว ซึ่งทั้งสองบริษัทไม่ได้ใช้อุปกรณ์ต้องห้ามตามมาตรา 889 ถือเป็นหลักสำคัญในการปฏิบัติตามข้อกำหนดของเรา

ทั้ง [คลาวด์แฟลร์](https://www.cloudflare.com/) และ [ดาต้าแพ็คเก็ต](https://datapacket.com/) มุ่งมั่นที่จะรักษามาตรฐานความปลอดภัยขั้นสูง และไม่ใช้อุปกรณ์ที่ห้ามตามมาตรา 889 **การใช้ Cloudflare และ DataPacket เพื่อให้เป็นไปตามมาตรา 889** ถือเป็นพื้นฐานของบริการของเรา

### ความมุ่งมั่นของ Cloudflare {#cloudflares-commitment}

[คลาวด์แฟลร์](https://www.cloudflare.com/) ระบุถึง **การปฏิบัติตามมาตรา 889** ไว้อย่างชัดเจนใน **[จรรยาบรรณของบุคคลที่สาม](https://cf-assets.www.cloudflare.com/slt3lc6tev37/284hiWkCYNc49GQpAeBvGN/e137cdac96d1c4cd403c6b525831d284/Third_Party_Code_of_Conduct.pdf)** โดยระบุว่า:

> "ภายใต้มาตรา 889 ของพระราชบัญญัติการอนุญาตการป้องกันประเทศ (NDAA) Cloudflare จะไม่ใช้หรืออนุญาตให้ใช้อุปกรณ์โทรคมนาคม ผลิตภัณฑ์เฝ้าระวังวิดีโอ หรือบริการที่ผลิตหรือจัดทำโดยบริษัท Huawei Technologies, ZTE Corporation, Hytera Communications Corporation, Hangzhou Hikvision Digital Technology Company หรือ Dahua Technology Company (หรือบริษัทในเครือหรือบริษัทสาขาของนิติบุคคลดังกล่าว) ในห่วงโซ่อุปทานของตน"

*(ที่มา: จรรยาบรรณบุคคลที่สามของ Cloudflare ดึงข้อมูลเมื่อวันที่ 29 เมษายน 2025)*

คำชี้แจงที่ชัดเจนนี้ยืนยันว่าโครงสร้างพื้นฐาน [คลาวด์แฟลร์](https://www.cloudflare.com/) ซึ่ง **ส่งต่ออีเมล** ใช้ประโยชน์นั้นเป็นไปตามข้อกำหนดของส่วนที่ 889

### โครงสร้างพื้นฐานของ DataPacket {#datapackets-infrastructure}

[ดาต้าแพ็คเก็ต](https://datapacket.com/) ผู้ให้บริการเซิร์ฟเวอร์ของเรา ใช้อุปกรณ์เครือข่ายจาก **Arista Networks** และ **Cisco** เท่านั้น ทั้ง Arista และ Cisco ไม่อยู่ในกลุ่มบริษัทที่ถูกห้ามตามมาตรา 889 ทั้งสองบริษัทเป็นผู้จำหน่ายที่ได้รับการยอมรับและใช้งานอย่างแพร่หลายในสภาพแวดล้อมที่ปลอดภัยสำหรับองค์กรและหน่วยงานภาครัฐ และเป็นที่รู้จักในการปฏิบัติตามมาตรฐานความปลอดภัยและการปฏิบัติตามข้อกำหนดที่เข้มงวด

การใช้เฉพาะ [คลาวด์แฟลร์](https://www.cloudflare.com/) และ [ดาต้าแพ็คเก็ต](https://datapacket.com/) ช่วยให้มั่นใจได้ว่าห่วงโซ่การส่งมอบบริการทั้งหมดจะปราศจากอุปกรณ์ต้องห้ามตามมาตรา 889 จึงให้ **การส่งต่ออีเมลที่ปลอดภัยสำหรับหน่วยงานของรัฐบาลกลาง** และผู้ใช้ที่ใส่ใจเรื่องความปลอดภัยรายอื่นๆ

## เกินกว่ามาตรา 889: การปฏิบัติตามข้อกำหนดของรัฐบาลที่กว้างขึ้น {#beyond-section-889-broader-government-compliance}

ความมุ่งมั่นของเราต่อ **การรักษาความปลอดภัยอีเมลของรัฐบาล** และการปฏิบัติตามข้อกำหนดครอบคลุมมากกว่ามาตรา 889 แม้ว่า **การส่งต่ออีเมล** เองจะไม่ได้ประมวลผลหรือจัดเก็บข้อมูลรัฐบาลที่ละเอียดอ่อน เช่น [ข้อมูลที่ไม่จัดประเภทที่ควบคุม (CUI)](https://en.wikipedia.org/wiki/Controlled_Unclassified_Information) โดยตรงในลักษณะเดียวกับที่แพลตฟอร์ม SaaS ขนาดใหญ่อาจทำ สถาปัตยกรรม **การส่งต่ออีเมลแบบโอเพนซอร์ส** ของเราและการพึ่งพาผู้ให้บริการที่ปลอดภัยและปฏิบัติตามข้อกำหนดนั้นสอดคล้องกับหลักการของกฎระเบียบสำคัญอื่นๆ:

* **[FAR (กฎระเบียบการจัดซื้อจัดจ้างของรัฐบาลกลาง)](https://en.wikipedia.org/wiki/Federal_Acquisition_Regulation):** ด้วยการใช้โครงสร้างพื้นฐานที่สอดคล้องตามมาตรฐานและนำเสนอบริการเชิงพาณิชย์ที่ตรงไปตรงมา เราจึงมอบหลักการส่งต่ออีเมลที่สอดคล้องตามมาตรฐาน FAR ซึ่งเหมาะสำหรับผู้รับเหมาภาครัฐ
* **พระราชบัญญัติความเป็นส่วนตัวและ [FISMA](https://en.wikipedia.org/wiki/Federal_Information_Security_Management_Act_of\_2002):** เราออกแบบ **ให้มุ่งเน้นความเป็นส่วนตัว** โดยนำเสนอหลักการ **อีเมลตามกฎหมายความเป็นส่วนตัว** เราไม่จัดเก็บอีเมลของคุณ อีเมลจะถูกส่งต่อโดยตรง ช่วยลดการจัดการข้อมูลให้น้อยที่สุด ผู้ให้บริการโครงสร้างพื้นฐานของเรา ([คลาวด์แฟลร์](https://www.cloudflare.com/), [ดาต้าแพ็คเก็ต](https://datapacket.com/)) จัดการระบบตามมาตรฐานความปลอดภัยขั้นสูงที่สอดคล้องกับหลักการ **อีเมลที่สอดคล้องตามมาตรฐาน FISMA**
* **[HIPAA](https://en.wikipedia.org/wiki/Health_Insurance_Portability_and_Accountability_Act):** สำหรับองค์กรที่ต้องการ **การส่งต่ออีเมลที่สอดคล้องตามมาตรฐาน HIPAA** **การส่งต่ออีเมล** สามารถเป็นส่วนหนึ่งของโซลูชันที่สอดคล้องตามมาตรฐานได้ เนื่องจากเราไม่ได้จัดเก็บอีเมล ความรับผิดชอบหลักในการปฏิบัติตามจึงอยู่ที่ระบบอีเมลปลายทาง อย่างไรก็ตาม ชั้นการขนส่งที่ปลอดภัยของเรารองรับข้อกำหนด HIPAA เมื่อใช้งานอย่างถูกต้อง

> \[!WARNING]
> อาจจำเป็นต้องใช้ [ข้อตกลงผู้ร่วมธุรกิจ (BAA)](https://en.wikipedia.org/wiki/Business_associate_agreement) กับผู้ให้บริการอีเมลรายสุดท้ายของคุณ ไม่ใช่ **การส่งต่ออีเมล** เอง เนื่องจากเราไม่ได้จัดเก็บเนื้อหาอีเมลของคุณ (เว้นแต่คุณจะใช้ [เลเยอร์จัดเก็บ IMAP/POP3 ที่เข้ารหัสของเรา](/blog/docs/best-quantum-safe-encrypted-email-service))

## เส้นทางข้างหน้าของเรา: ขยายขอบเขตการปฏิบัติตามกฎระเบียบ {#our-path-forward-expanding-compliance-horizons}

แม้ว่าการปฏิบัติตามมาตรา 889 ของเราจะเป็นรากฐานที่สำคัญ โดยเฉพาะอย่างยิ่งสำหรับผู้รับเหมาของรัฐบาลกลาง แต่เราก็เข้าใจดีว่าองค์กรและหน่วยงานรัฐบาลต่างๆ มีความต้องการด้านกฎระเบียบที่แตกต่างกันและเปลี่ยนแปลงอยู่เสมอ ที่ **ส่งต่ออีเมล** ความโปร่งใสคือกุญแจสำคัญ และเราต้องการแบ่งปันมุมมองของเราเกี่ยวกับภาพรวมของการปฏิบัติตามกฎระเบียบและทิศทางในอนาคตของเรา

เราตระหนักถึงความสำคัญของกรอบงานและกฎระเบียบ เช่น:

* **[ระบบการจัดการรางวัล (SAM)](https://sam.gov/):** จำเป็นสำหรับการทำสัญญากับรัฐบาลกลางโดยตรง
* **[FAR (กฎระเบียบการจัดซื้อจัดจ้างของรัฐบาลกลาง)](https://www.acquisition.gov/browse/index/far):** รวมถึงข้อกำหนดมาตรฐาน เช่น [FAR 52.212-4](https://www.acquisition.gov/far/52.212-4) สำหรับบริการเชิงพาณิชย์
* **[DFARS (ส่วนเสริมข้อบังคับการจัดซื้อจัดจ้างของรัฐบาลกลางด้านการป้องกันประเทศ)](https://en.wikipedia.org/wiki/Defense_Federal_Acquisition_Regulation_Supplement):** โดยเฉพาะ [DFARS 252.239-7010](https://www.acquisition.gov/dfars/252.239-7010-cloud-computing-services.) สำหรับบริการคลาวด์ของกระทรวงกลาโหม
* **[CMMC (การรับรองแบบจำลองความสมบูรณ์ของความปลอดภัยทางไซเบอร์)](https://en.wikipedia.org/wiki/Cybersecurity_Maturity_Model_Certification):** จำเป็นสำหรับผู้รับเหมาของกระทรวงกลาโหมที่จัดการ [ข้อมูลสัญญาของรัฐบาลกลาง (FCI)](https://en.wikipedia.org/wiki/Federal_Contract_Information) หรือ CUI
* **[NIST SP 800-171](https://csrc.nist.gov/pubs/sp/800/171/r3/final):** พื้นฐานสำหรับ CMMC ระดับ 2 มุ่งเน้นการปกป้อง CUI ([NIST](https://en.wikipedia.org/wiki/National_Institute_of_Standards_and_Technology) - สถาบันมาตรฐานและเทคโนโลยีแห่งชาติ)
* **[FedRAMP (โครงการจัดการความเสี่ยงและการอนุญาตของรัฐบาลกลาง)](https://en.wikipedia.org/wiki/FedRAMP):** มาตรฐานสำหรับบริการคลาวด์ที่หน่วยงานรัฐบาลกลางใช้
* **__PROTECTED_LINK_77__0:** กรอบการทำงานที่ครอบคลุมสำหรับความมั่นคงปลอดภัยสารสนเทศของรัฐบาลกลาง
* **__PROTECTED_LINK_77__1:** สำหรับการจัดการข้อมูลสุขภาพที่ได้รับการคุ้มครอง (PHI)
* **__PROTECTED_LINK_77__2:** สำหรับการปกป้องบันทึกการศึกษาของนักเรียน
* **__PROTECTED_LINK_77__3:** สำหรับบริการที่เกี่ยวข้องกับเด็กอายุต่ำกว่า 13 ปี

**ตำแหน่งปัจจุบันและเป้าหมายในอนาคตของเรา:**

การออกแบบหลักของ **Forward Email** ซึ่งเน้นความเป็นส่วนตัว **เป็นโอเพนซอร์ส** และการลดการจัดการข้อมูลให้น้อยที่สุด (โดยเฉพาะอย่างยิ่งในบริการ **การส่งต่ออีเมล** ขั้นพื้นฐานของเรา) สอดคล้องกับ *หลักการ* เบื้องหลังกฎระเบียบเหล่านี้หลายประการ แนวปฏิบัติด้านความปลอดภัยที่มีอยู่ของเรา (การเข้ารหัส การรองรับมาตรฐานอีเมลสมัยใหม่) และการปฏิบัติตามมาตรา 889 ถือเป็นจุดเริ่มต้นที่แข็งแกร่ง

อย่างไรก็ตาม การได้รับการรับรองหรืออนุมัติอย่างเป็นทางการสำหรับกรอบการทำงานอย่าง **FedRAMP** หรือ **CMMC** ถือเป็นภารกิจสำคัญ ซึ่งประกอบด้วยเอกสารประกอบที่เข้มงวด การนำระบบควบคุมทางเทคนิคและขั้นตอนเฉพาะมาใช้ (ซึ่งมักจะเป็นหลายร้อยระบบ) การประเมินอิสระ (เช่น [3PAO](https://www.fedramp.gov/glossary/#3pao) สำหรับ FedRAMP - องค์กรประเมินบุคคลที่สาม) และการติดตามตรวจสอบอย่างต่อเนื่อง

> \[!IMPORTANT]
> การปฏิบัติตามข้อกำหนดไม่ได้เกี่ยวกับเทคโนโลยีเพียงอย่างเดียว แต่ยังเกี่ยวกับกระบวนการ นโยบาย และการเฝ้าระวังอย่างต่อเนื่อง การได้รับการรับรอง เช่น FedRAMP หรือ CMMC ต้องใช้การลงทุนและเวลาอย่างมาก

**ความมุ่งมั่นของเรา:**

เนื่องจาก **อีเมลส่งต่อ** เติบโตขึ้น และความต้องการของลูกค้ามีการเปลี่ยนแปลง เราจึงมุ่งมั่นที่จะสำรวจและดำเนินการให้ได้รับการรับรองการปฏิบัติตามข้อกำหนดที่เกี่ยวข้อง ซึ่งรวมถึงแผนงานสำหรับ:

1. **การลงทะเบียน SAM:** เพื่ออำนวยความสะดวกในการมีส่วนร่วมโดยตรงกับหน่วยงานรัฐบาลกลางของสหรัฐอเมริกา
2. **การทำให้กระบวนการเป็นทางการ:** การปรับปรุงเอกสารและขั้นตอนภายในของเราให้สอดคล้องกับมาตรฐาน เช่น NIST SP 800-171 ซึ่งเป็นพื้นฐานสำหรับ CMMC
3. **การประเมินเส้นทาง FedRAMP:** การประเมินข้อกำหนดและความเป็นไปได้ในการขออนุญาต FedRAMP โดยอาจเริ่มต้นด้วยเกณฑ์พื้นฐานระดับต่ำหรือปานกลาง และอาจใช้ประโยชน์จากแบบจำลอง [TO-SaaS](https://www.fedramp.gov/blog/fedramp-releases-low-impact-saas-baseline/) หากเกี่ยวข้อง
4. **การสนับสนุนความต้องการเฉพาะ:** การตอบสนองข้อกำหนด เช่น HIPAA (อาจผ่าน BAA และการกำหนดค่าเฉพาะสำหรับข้อมูลที่จัดเก็บ) และ FERPA (ผ่านข้อกำหนดและการควบคุมตามสัญญาที่เหมาะสม) ขณะที่เรามีส่วนร่วมกับสถาบันด้านการดูแลสุขภาพและการศึกษามากขึ้น

การเดินทางครั้งนี้ต้องอาศัยการวางแผนและการลงทุนอย่างรอบคอบ แม้ว่าเราจะยังไม่มีกำหนดเวลาที่ชัดเจนสำหรับการรับรองทั้งหมด แต่การเสริมสร้างมาตรฐานการปฏิบัติตามกฎระเบียบเพื่อตอบสนองความต้องการของภาครัฐและอุตสาหกรรมที่อยู่ภายใต้การกำกับดูแลถือเป็นส่วนสำคัญในแผนงานของเรา

> \[!NOTE]
> เราเชื่อว่าลักษณะ **โอเพนซอร์ส** ของเรามอบความโปร่งใสที่เป็นเอกลักษณ์ตลอดกระบวนการนี้ ช่วยให้ชุมชนและลูกค้าของเราได้เห็นถึงความมุ่งมั่นของเราด้วยตนเอง

เราจะอัปเดตชุมชนของเราอย่างต่อเนื่องเมื่อเราบรรลุเป้าหมายสำคัญในการปฏิบัติตามข้อกำหนดของเรา

## เหตุใดสิ่งนี้จึงสำคัญสำหรับคุณ {#why-this-matters-for-you}

การเลือกบริการส่งต่ออีเมลที่สอดคล้องกับมาตรา 889 เช่น **ส่งต่ออีเมล** หมายความว่า:

* **ความอุ่นใจ:** โดยเฉพาะอย่างยิ่งสำหรับหน่วยงานภาครัฐ ผู้รับเหมา และองค์กรที่ใส่ใจเรื่องความปลอดภัย
* **ความเสี่ยงที่ลดลง:** หลีกเลี่ยงความขัดแย้งที่อาจเกิดขึ้นกับ **กฎระเบียบของรัฐบาลกลางเกี่ยวกับอีเมล**
* **ความน่าเชื่อถือ:** แสดงให้เห็นถึงความมุ่งมั่นในด้านความปลอดภัยและความสมบูรณ์ของห่วงโซ่อุปทาน

**การส่งต่ออีเมล** มอบวิธีการที่เรียบง่าย เชื่อถือได้ และ *เป็นไปตามข้อกำหนด* ในการจัดการความต้องการ **การส่งต่ออีเมล** ของโดเมนที่กำหนดเองของคุณ

## การส่งต่ออีเมลที่ปลอดภัยและเป็นไปตามข้อกำหนดเริ่มต้นที่นี่ {#secure-compliant-email-forwarding-starts-here}

**Forward Email** มุ่งมั่นที่จะมอบบริการส่งต่ออีเมลที่ปลอดภัย เป็นส่วนตัว และเป็นแบบโอเพนซอร์ส** การปฏิบัติตามมาตรา 889** ของเรา ซึ่งเกิดขึ้นผ่านความร่วมมือกับ [คลาวด์แฟลร์](https://www.cloudflare.com/) และ [ดาต้าแพ็คเก็ต](https://datapacket.com/) (ซึ่งสะท้อนถึงการปฏิบัติตาม **Forward Email ของเราสำหรับงานของสถาบันกองทัพเรือสหรัฐฯ**) ถือเป็นเครื่องพิสูจน์ถึงความมุ่งมั่นนี้ ไม่ว่าคุณจะเป็นหน่วยงานรัฐบาล ผู้รับเหมา หรือเพียงแค่ให้ความสำคัญกับ **ความปลอดภัยของอีเมลรัฐบาล** **Forward Email** ก็ถูกสร้างขึ้นมาเพื่อคุณ

พร้อมสำหรับ **การส่งต่ออีเมลที่ปลอดภัยและสอดคล้อง** แล้วหรือยัง [สมัครสมาชิกฟรีวันนี้!](https://forwardemail.net)

## อ้างอิง {#references}

* **มาตรา 889 (NDAA):** <https://www.acquisition.gov/Section-889-Policies>
* **Cloudflare:** <https://www.cloudflare.com/>
* **จรรยาบรรณบุคคลที่สามของ Cloudflare:** <https://cf-assets.www.cloudflare.com/slt3lc6tev37/284hiWkCYNc49GQpAeBvGN/e137cdac96d1c4cd403c6b525831d284/Third_Party_Code_of_Conduct.pdf>
* **DataPacket:** <https://datapacket.com/>
* **ระบบการจัดการรางวัล (SAM):** <https://sam.gov/>
* **ข้อบังคับว่าด้วยการจัดซื้อจัดจ้างของรัฐบาลกลาง (FAR):** <https://www.acquisition.gov/browse/index/far>
* **FAR 52.212-4:** <https://www.acquisition.gov/far/52.212-4>
* **ภาคผนวกข้อบังคับว่าด้วยการจัดซื้อจัดจ้างของรัฐบาลกลางด้านกลาโหม (DFARS):** <https://www.acquisition.gov/dfars>
* **DFARS 252.239-7010:** <https://www.acquisition.gov/dfars/252.239-7010-cloud-computing-services.>
* **การรับรองแบบจำลองความสมบูรณ์ของความมั่นคงปลอดภัยไซเบอร์ (CMMC):** <https://dodcio.defense.gov/cmmc/About/>
* **NIST SP 800-171:** <https://www.cloudflare.com/>0
* **โครงการจัดการความเสี่ยงและการอนุญาตของรัฐบาลกลาง (FedRAMP):** <https://www.cloudflare.com/>1
* **พระราชบัญญัติปรับปรุงความปลอดภัยสารสนเทศของรัฐบาลกลาง (FISMA):** <https://www.cloudflare.com/>2
* **พระราชบัญญัติความสามารถในการโอนย้ายและความรับผิดชอบด้านการประกันสุขภาพ (HIPAA):** <https://www.cloudflare.com/>3
* **พระราชบัญญัติสิทธิทางการศึกษาของครอบครัวและความเป็นส่วนตัว (FERPA):** <https://www.cloudflare.com/>4
* **พระราชบัญญัติคุ้มครองความเป็นส่วนตัวออนไลน์ของเด็ก (COPPA):** <https://www.cloudflare.com/>5