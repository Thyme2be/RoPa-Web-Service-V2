import { OwnerRecord } from "@/types/dataOwner";
import { RopaStatus, DataType, CollectionMethod, RetentionUnit } from "@/types/enums";

export const mockOwnerRecords: Partial<OwnerRecord>[] = [
    {
        id: "c88f4b5a-7e1e-4b5a-9b5a-7e1e4b5a9b5a",
        documentName: "ระบบจัดการพนักงาน HR 2024",
        status: RopaStatus.Active,
        title: "นาย",
        firstName: "พรรษชล",
        lastName: "บุญมาก",
        address: "123/45 ถนนประดิษฐ์มนูธรรม แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230",
        email: "passachol.b@example.com",
        phoneNumber: "0812345678",
        dataSubjectName: "พนักงานบริษัท",
        processingActivity: "การบริหารจัดการทรัพยากรบุคคล",
        purpose: "เพื่อการจ่ายเงินเดือนและสวัสดิการ",
        personalData: "ชื่อ, เลขบัตรประชาชน, เลขบัญชีธนาคาร",
        dataType: DataType.General,
        collectionMethod: CollectionMethod.SoftFile,
        legalBasis: "ฐานปฏิบัติตามสัญญา (Contract)",
        retention: {
            storageType: CollectionMethod.SoftFile,
            method: ["Cloud Storage"],
            duration: 5,
            unit: RetentionUnit.Year,
            accessControl: "ฝ่ายบุคคล",
            deletionMethod: "ลบไฟล์"
        }
    },
    {
        id: "d29f3c6b-8f2f-4c6b-9c6b-8f2f5c6b9c6b",
        documentName: "แคมเปญการตลาด Marketing 11.11",
        status: RopaStatus.Draft,
        title: "นางสาว",
        firstName: "สมใจ",
        lastName: "นึกคิด",
        address: "456 ถนนสุขุมวิท กรุงเทพฯ 10110",
        email: "somjai.n@marketing.com",
        phoneNumber: "0898765432",
        dataSubjectName: "ลูกค้าเป้าหมาย",
        processingActivity: "การจัดส่งข่าวสารการตลาด",
        purpose: "เพื่อส่งโปรโมชั่นทาง SMS/Email",
        personalData: "ชื่อ, เบอร์โทรศัพท์, อีเมล",
        dataType: DataType.General,
        collectionMethod: CollectionMethod.SoftFile,
        legalBasis: "ฐานความยินยอม (Consent)",
        retention: {
            storageType: CollectionMethod.SoftFile,
            method: ["Excel"],
            duration: 1,
            unit: RetentionUnit.Year,
            accessControl: "ฝ่ายการตลาด",
            deletionMethod: "ทำลายไฟล์"
        }
    },
    {
        id: "e30f4d7c-9g3g-4d7c-9d7c-9g3g5d7c9d7c",
        documentName: "ระบบจัดซื้อจัดจ้าง Procurement",
        status: RopaStatus.Submitted,
        title: "นาย",
        firstName: "เก่งจริง",
        lastName: "มากความ",
        address: "789 ถนนพหลโยธิน กรุงเทพฯ 10400",
        email: "kengjing.m@procure.com",
        phoneNumber: "0822223333",
        dataSubjectName: "คู่ค้าและซัพพลายเออร์",
        processingActivity: "การคัดเลือกคู่ค้าปลีก",
        purpose: "เพื่อการออกใบแจ้งหนี้และโอนเงิน",
        personalData: "ชื่อบริษัท, เลขประจำตัวผู้เสียภาษี",
        dataType: DataType.General,
        collectionMethod: CollectionMethod.SoftFile,
        legalBasis: "ฐานหน้าที่ตามกฎหมาย (Legal Obligation)",
        retention: {
            storageType: CollectionMethod.SoftFile,
            method: ["ERP System"],
            duration: 10,
            unit: RetentionUnit.Year,
            accessControl: "ฝ่ายบัญชี",
            deletionMethod: "บันทึกถาวร"
        }
    },
    {
        id: "ROPA-2026-0891",
        documentName: "ระบบ e-Logistics Gateway (พิธีการศุลกากร)",
        status: RopaStatus.Rejected,
        suggestions: [
            { id: "s1", section: "ส่วนที่ 2 : วัตถุประสงค์การประมวลผล", sectionId: 2, comment: "วัตถุประสงค์ในการเก็บข้อมูลเพื่อส่งต่อกรมศุลกากรมีความชัดเจนแล้ว แต่กรุณาเพิ่มรายละเอียดการจัดเก็บ log การเข้าถึงระบบ (Access Log) ให้ครอบคลุมตามมาตรฐานความปลอดภัยข้อมูล", reviewer: "วิริยา พรหมรักษ์", date: "26/03/2026, 14:30", role: "owner", status: "pending" },
            { id: "s2", section: "ส่วนที่ 4 : ระยะเวลาการเก็บรักษา", sectionId: 4, comment: "ระยะเวลาการเก็บรักษาข้อมูลชุดนี้ต้องสอดคล้องกับระเบียบของกรมศุลกากร (ปกติ 5 ปี) กรุณาตรวจสอบและอ้างอิงข้อเขียนทางกฎหมายให้ชัดเจน", reviewer: "วิริยา พรหมรักษ์", date: "26/03/2026, 14:30", role: "owner", status: "pending" }
        ]
    },
    {
        id: "ROPA-2026-0892",
        documentName: "ระบบ e-Tax Invoice & e-Receipt",
        status: RopaStatus.Submitted,
        suggestions: [
            { id: "s3", section: "ส่วนที่ 5 : การส่งข้อมูลไปต่างประเทศ", sectionId: 5, comment: "กรณีมีการใช้ Cloud Storage ของ AWS (Singapore Region) สำหรับสำรองข้อมูลใบกำกับภาษี กรุณาแนบเอกสารรับรองมาตรฐานการคุ้มครองข้อมูลส่วนบุคคลของ Cloud Provider", reviewer: "วิริยา พรหมรักษ์", date: "26/03/2026, 14:30", role: "processor", statusLabel: "เสร็จสมบูรณ์", status: "fixed" },
            { id: "s4", section: "ส่วนที่ 6 : มาตรการรักษาความปลอดภัย", sectionId: 6, comment: "กรุณาระบุมาตรการในการเข้ารหัสข้อมูล (Encryption) สำหรับข้อมูลส่วนบุคคลที่ปรากฏบนใบกำกับภาษีขณะจัดเก็บ (At Rest) เพื่อให้สอดคล้องกับ ISMS ของบริษัท", reviewer: "วิริยา พรหมรักษ์", date: "26/03/2026, 14:30", role: "processor", statusLabel: "ไม่เสร็จสมบูรณ์", status: "pending" }
        ]
    },
    {
        id: "h63i7g0f-2j6j-7g0f-2g0f-2j6j8g0f2g0f",
        documentName: "ระบบลงทะเบียนผู้มาติดต่อ (Visitor)",
        status: RopaStatus.Submitted,
        title: "นางสาว",
        firstName: "ต้อนรับ",
        lastName: "ยินดี",
        address: "77 ถนนวิภาวดีรังสิต กรุงเทพฯ 10900",
        email: "reception@company.com",
        phoneNumber: "029876543",
        dataSubjectName: "ผู้มาติดต่อ",
        processingActivity: "การบันทึกข้อมูลผู้เข้า-ออกอาคาร",
        purpose: "เพื่อความปลอดภัยในอาคาร",
        personalData: "ชื่อ, นามสกุล, เลขบัตรประชาชน",
        dataType: DataType.General,
        collectionMethod: CollectionMethod.HardCopy,
        legalBasis: "ฐานประโยชน์โดยชอบด้วยกฎหมาย (Legitimate Interest)",
        retention: {
            storageType: CollectionMethod.HardCopy,
            method: ["สมุดลงทะเบียน"],
            duration: 1,
            unit: RetentionUnit.Year,
            accessControl: "หัวหน้าฝ่ายรักษาความปลอดภัย",
            deletionMethod: "ทำลายเอกสาร"
        }
    },
    {
        id: "i74j8h1g-3k7k-8h1g-3h1g-3k7k9h1g3h1g",
        documentName: "แคมเปญสิทธิประโยชน์สมาชิก Silver Card",
        status: RopaStatus.Draft,
        title: "นาย",
        firstName: "ประหยัด",
        lastName: "มัธยัสถ์",
        address: "55 ถนนสุขุมวิท กรุงเทพฯ 10110",
        email: "prayad.m@member.com",
        phoneNumber: "0811112222",
        dataSubjectName: "สมาชิกระดับ Silver",
        processingActivity: "การจัดส่งส่วนลดพิเศษ",
        purpose: "เพื่อส่งเสริมการขาย",
        personalData: "ชื่อ, อีเมล, ยอดซื้อสะสม",
        dataType: DataType.General,
        collectionMethod: CollectionMethod.SoftFile,
        legalBasis: "ฐานความยินยอม (Consent)",
        retention: {
            storageType: CollectionMethod.SoftFile,
            method: ["Marketing DB"],
            duration: 2,
            unit: RetentionUnit.Year,
            accessControl: "ฝ่าย CRM",
            deletionMethod: "ลบ record"
        }
    },
    {
        id: "j85k9i2h-4l8l-9i2h-4i2h-4l8l0i2h4i2h",
        documentName: "ระบบสวัสดิการบุตรพนักงาน",
        status: RopaStatus.Rejected,
        title: "นาง",
        firstName: "สายใจ",
        lastName: "ดูแล",
        address: "11 ถนนแจ้งวัฒนะ กรุงเทพฯ 10210",
        email: "saijai.d@hr-welfare.com",
        phoneNumber: "0844445555",
        dataSubjectName: "บุตรของพนักงาน",
        processingActivity: "การจ่ายเงินสวัสดิการช่วยบุตร",
        purpose: "เพื่อการมอบสวัสดิการ",
        personalData: "ชื่อ-นามสกุลบุตร, สูติบัตร",
        dataType: DataType.Sensitive,
        collectionMethod: CollectionMethod.HardCopy,
        legalBasis: "ฐานปฏิบัติตามสัญญา (Contract)",
        retention: {
            storageType: CollectionMethod.SoftFile,
            method: ["HR Cloud"],
            duration: 10,
            unit: RetentionUnit.Year,
            accessControl: "ฝ่ายสวัสดิการ",
            deletionMethod: "ลบไฟล์"
        },
        suggestions: [
            { id: "s5", section: "ส่วนที่ 5 : ข้อมูลส่วนบุคคลที่เก็บรวบรวม", sectionId: 5, comment: "ข้อมูลสูติบัตรเป็นข้อมูลอ่อนไหว (Sensitive) ควรเพิ่มมาตรการความปลอดภัยส่วนนี้ให้รัดกุมที่สุด", reviewer: "Admin", date: "01/04/2026, 10:00", role: "owner", status: "pending" }
        ]
    }
];
