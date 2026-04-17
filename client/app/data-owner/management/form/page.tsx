"use client";

import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import Stepper from "@/components/layouts/Stepper";
import FormActions from "@/components/layouts/FormActions";
import Section1GeneralInfo from "@/components/formSections/Section1GeneralInfo";
import Section2ActivityDetails from "@/components/formSections/Section2ActivityDetails";
import Section3Stored from "@/components/formSections/Section3Stored";
import Section4Retention from "@/components/formSections/Section4Retention";
import Section5Legal from "@/components/formSections/Section5Legal";
import Section6TOMs from "@/components/formSections/Section6TOMs";
import Section1_5Channel from "@/components/formSections/Section1_5Channel";
import { OwnerRecord } from "@/types/dataOwner";
import { RopaStatus, CollectionMethod, RetentionUnit, DataType } from "@/types/enums";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRopa } from "@/context/RopaContext";
import { cn } from "@/lib/utils";
import FormTabs from "@/components/ropa/FormTabs";

function ManagementFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const recordId = searchParams.get("id");
    const nameParam = searchParams.get("name");
    const companyParam = searchParams.get("company");
    const dueDateParam = searchParams.get("dueDate");
    const viewMode = searchParams.get("mode") === "view";
    
    const [activeTab, setActiveTab] = useState("owner");
    const { saveRecord, getById } = useRopa();
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [form, setForm] = useState<Partial<OwnerRecord>>({
        documentName: nameParam || "",
        processorCompany: companyParam || "",
        dueDate: dueDateParam || "",
        title: "",
        firstName: "",
        lastName: "",
        address: "",
        email: "",
        phoneNumber: "",
        status: RopaStatus.Draft,
        id: crypto.randomUUID(),
        dataSource: { direct: false, indirect: false },
        minorConsent: { under10: false, age10to20: false, none: false },
        internationalTransfer: { isTransfer: false },
        dataCategories: [],
        storedDataTypes: [],
        storedDataTypesOther: "",
        retention: {
            storageType: CollectionMethod.SoftFile,
            method: [],
            duration: 0,
            unit: RetentionUnit.Year,
            accessControl: "",
            deletionMethod: ""
        },
        dataType: DataType.General,
        securityMeasures: {}
    });

    const initialFormState = { ...form, id: crypto.randomUUID() };

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load draft from localStorage or existing record by ID
    useEffect(() => {
        if (recordId) {
            const existing = getById(recordId);
            if (existing) {
                setForm(prev => ({ ...prev, ...existing }));
                return;
            }
        }
        // Fallback to draft
        const savedDraft = localStorage.getItem("ropa_owner_draft");
        if (savedDraft && !recordId) {
            try {
                const parsed = JSON.parse(savedDraft);
                setForm(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse draft from localStorage", e);
            }
        }
    }, [recordId]);

    const validateField = (name: string, value: any) => {
        let error = "";
        if (name === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
                error = "รูปแบบอีเมลไม่ถูกต้อง";
            }
        } else if (name === "phoneNumber") {
            const phoneRegex = /^[0-9]{10}$/;
            if (value && !phoneRegex.test(value)) {
                error = "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องมี 10 หลัก)";
            }
        }

        setErrors(prev => ({ ...prev, [name]: error }));
        return error === "";
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Document Name
        if (!form.documentName?.trim()) newErrors.documentName = "กรุณากรอกชื่อเอกสาร";

        // Section 1
        if (!form.title) newErrors.title = "กรุณาเลือกคำนำหน้า";
        if (!form.firstName) newErrors.firstName = "กรุณากรอกชื่อ";
        if (!form.lastName) newErrors.lastName = "กรุณากรอกนามสกุล";
        if (!form.address) newErrors.address = "กรุณากรอกที่อยู่";
        if (!form.email) newErrors.email = "กรุณากรอกอีเมล";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
        if (!form.phoneNumber) newErrors.phoneNumber = "กรุณากรอกเบอร์โทรศัพท์";
        else if (!/^[0-9]{10}$/.test(form.phoneNumber)) newErrors.phoneNumber = "เบอร์โทรศัพท์ต้องมี 10 หลัก";

        // Section 2 - Activity
        if (!form.dataSubjectName) newErrors.dataSubjectName = "กรุณากรอกชื่อเจ้าของข้อมูลส่วนบุคคล";
        if (!form.processingActivity) newErrors.processingActivity = "กรุณากรอกกิจกรรมประมวลผล";
        if (!form.purpose) newErrors.purpose = "กรุณากรอกวัตถุประสงค์การประมวลผล";

        // Section 3 - Stored
        if (!form.storedDataTypes || form.storedDataTypes.length === 0) newErrors.storedDataTypes = "กรุณาเลือกข้อมูลส่วนบุคคลอย่างน้อย 1 รายการ";
        if (form.storedDataTypes?.includes("อื่นๆ") && !form.storedDataTypesOther) newErrors.storedDataTypesOther = "กรุณาระบุข้อมูลส่วนบุคคลอื่นๆ";
        if (!form.dataCategories || form.dataCategories.length === 0) newErrors.dataCategories = "กรุณาเลือกหมวดหมู่ของข้อมูลอย่างน้อย 1 รายการ";
        if (!form.dataType) newErrors.dataType = "กรุณาเลือกประเภทของข้อมูล";

        // Section 4 - Retention
        if (!form.collectionMethod) newErrors.collectionMethod = "กรุณาเลือกวิธีการได้มาซึ่งข้อมูล";
        if (!form.dataSource?.direct && !form.dataSource?.indirect) newErrors.dataSource = "กรุณาเลือกแหล่งที่ได้มาอย่างน้อย 1 แหล่ง";
        if (!form.retention?.storageType) newErrors.storageType = "กรุณาเลือกประเภทของข้อมูลที่จัดเก็บ";
        if (!form.retention?.method || form.retention?.method.length === 0) newErrors.retentionMethod = "กรุณาเลือกวิธีการเก็บรักษาข้อมูล";
        if (!form.retention?.duration || form.retention?.duration <= 0) newErrors.retentionDuration = "กรุณาระบุระยะเวลาการเก็บรักษาข้อมูล";
        if (!form.retention?.accessControl) newErrors.accessControl = "กรุณาระบุสิทธิและวิธีการเข้าถึงข้อมูล";
        if (!form.retention?.deletionMethod) newErrors.deletionMethod = "กรุณาระบุวิธีการลบหรือทำลายข้อมูล";

        // Section 5 - Legal
        if (!form.legalBasis) newErrors.legalBasis = "กรุณาระบุฐานในการประมวลผล";
        if (!form.minorConsent?.under10 && !form.minorConsent?.age10to20 && !form.minorConsent?.none) newErrors.minorConsent = "กรุณาเลือกการขอความยินยอมของผู้เยาว์อย่างน้อย 1 รายการ";
        if (form.internationalTransfer?.isTransfer === undefined || form.internationalTransfer?.isTransfer === null) newErrors.isTransfer = "กรุณาเลือกว่ามีการส่งข้อมูลไปต่างประเทศหรือไม่";

        if (form.internationalTransfer?.isTransfer === true) {
            if (!form.internationalTransfer.country) newErrors.transferCountry = "กรุณาระบุประเทศปลายทาง";
            if (!form.internationalTransfer.companyName) newErrors.transferCompany = "กรุณาระบุชื่อบริษัทในเครือ";
            if (!form.internationalTransfer.transferMethod) newErrors.transferMethod = "กรุณาระบุวิธีการโอนข้อมูล";
            if (!form.internationalTransfer.protectionStandard) newErrors.transferStandard = "กรุณาระบุมาตรฐานการคุ้มครองข้อมูล";
            if (!form.internationalTransfer.exception) newErrors.transferException = "กรุณาระบุข้อยกเว้นตามมาตรา 28";
        }
        if (!form.exemptionDisclosure) newErrors.exemptionDisclosure = "กรุณาระบุการใช้หรือเปิดเผยข้อมูลที่ได้รับยกเว้น";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstErrorField = Object.keys(newErrors)[0];
            const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
            return false;
        }

        return true;
    };

    const handleChange = (e: any) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        let val: any = value;
        if (type === "number") {
            val = value === "" ? "" : Math.max(0, Number(value));
        }
        if (type === "checkbox") {
            if (!name.includes("[]")) {
                val = (value && value !== "on") ? (checked ? value : "") : checked;
            }
        }

        if (typeof val === "string") {
            if (val.toLowerCase() === "true") val = true;
            else if (val.toLowerCase() === "false") val = false;
        }

        if (name === "email" || name === "phoneNumber") {
            validateField(name, val);
        }

        setForm((prev: any) => {
            const keys = name.split(".");

            if (name.endsWith("[]")) {
                const arrayKey = name.replace("[]", "");
                const currentArray = prev[arrayKey] || [];
                const newArray = checked
                    ? [...currentArray, value]
                    : currentArray.filter((v: string) => v !== value);
                return { ...prev, [arrayKey]: newArray };
            }

            if (keys.length === 1) {
                return { ...prev, [name]: val };
            }

            if (keys.length === 2) {
                const [parent, child] = keys;
                return {
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: val
                    }
                };
            }

            return prev;
        });
    };

    const getCompletedSteps = () => {
        const completed = [];

        // Step 1: Recorder
        if (form.title && form.firstName && form.lastName && form.address && form.email && form.phoneNumber) {
            completed.push(1);
        }

        // Step 2: Channel
        if (form.dataSource?.direct || form.dataSource?.indirect) {
            completed.push(2);
        }

        // Step 3: Activity
        if (form.dataSubjectName && form.processingActivity && form.purpose) {
            completed.push(3);
        }

        // Step 4: Data Types
        if (
            form.dataCategories && form.dataCategories.length > 0 &&
            form.dataType &&
            form.storedDataTypes && form.storedDataTypes.length > 0
        ) {
            completed.push(4);
        }

        // Step 5: Storage
        if (
            form.collectionMethod &&
            form.retention?.duration &&
            form.retention?.unit &&
            form.retention?.accessControl &&
            form.retention?.deletionMethod
        ) {
            completed.push(5);
        }

        // Step 6: Consent
        const isTransferComplete = form.internationalTransfer?.isTransfer === false ||
            (form.internationalTransfer?.isTransfer === true && form.internationalTransfer?.country && form.internationalTransfer?.transferMethod);

        if (form.legalBasis && isTransferComplete && form.exemptionDisclosure) {
            completed.push(6);
        }

        // Step 7: Measures
        const sm = form.securityMeasures;
        if (sm?.organizational && sm?.accessControl && sm?.technical && sm?.responsibility && sm?.physical && sm?.audit) {
            completed.push(7);
        }

        return completed;
    };

    const completedSteps = getCompletedSteps();

    const handleSave = () => {
        if (!form.documentName) {
            setErrors(prev => ({ ...prev, documentName: "กรุณาตั้งชื่อเอกสาร" }));
        }
        if (validateForm()) {
            setIsReviewMode(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleFinalConfirm = () => {
        const saved = saveRecord({
            ...form,
            status: RopaStatus.Active,
        } as OwnerRecord);
        localStorage.removeItem("ropa_owner_draft");
        setIsSuccessModalOpen(true);
    };

    const handleCancel = () => {
        if (confirm("คุณต้องการยกเลิกการกรอกข้อมูลใช่หรือไม่? ข้อมูลที่ยังไม่ได้บันทึกจะหายไป")) {
            setForm(initialFormState);
            setErrors({});
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDraft = () => {
        saveRecord({ ...form, status: RopaStatus.Draft } as OwnerRecord);
        alert("บันทึกฉบับร่างเรียบร้อยแล้ว");
    };

    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low overflow-x-hidden">
                <TopBar
                    documentName={form.documentName}
                    handleChange={handleChange}
                    status={form.status}
                    hideSearch={true}
                    hasError={!!errors.documentName}
                    formMode={true}
                />

                <div className="flex-1 overflow-y-auto pt-6 pb-36 space-y-6 animate-in fade-in duration-1000">
                    
                    <FormTabs activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="px-10">
                        {activeTab === "owner" && (
                            <div className="space-y-8">
                                <Stepper completedSteps={completedSteps} />

                                <div className={cn(
                                    "space-y-8 transition-all duration-300",
                                    isReviewMode && "opacity-75 pointer-events-none grayscale-[0.2]"
                                )}>
                                    <Section1GeneralInfo form={form} handleChange={handleChange} errors={errors} disabled={viewMode || isReviewMode} />
                                    <Section1_5Channel form={form} handleChange={handleChange} errors={errors} disabled={viewMode || isReviewMode} />
                                    <Section2ActivityDetails form={form} handleChange={handleChange} errors={errors} disabled={viewMode || isReviewMode} />
                                    <Section3Stored form={form} handleChange={handleChange} errors={errors} disabled={viewMode || isReviewMode} />
                                    <Section4Retention form={form} handleChange={handleChange} errors={errors} disabled={viewMode || isReviewMode} />
                                    <Section5Legal form={form} handleChange={handleChange} errors={errors} disabled={viewMode || isReviewMode} />
                                    <Section6TOMs form={form} handleChange={handleChange} errors={errors} disabled={viewMode || isReviewMode} />
                                </div>
                            </div>
                        )}

                        {activeTab !== "owner" && (
                            <div className="bg-white rounded-[32px] p-20 flex flex-col items-center justify-center text-center opacity-50 border border-[#E5E2E1] border-dashed mt-8">
                                <span className="material-symbols-outlined text-[64px] mb-4 text-[#5C403D]">construction</span>
                                <h3 className="text-2xl font-black text-[#5C403D]">กำลังพัฒนาส่วนนี้</h3>
                                <p className="text-[#5F5E5E] font-bold mt-2">โปรดจัดการในส่วน "ส่วนของผู้รับผิดชอบข้อมูล" ก่อน</p>
                            </div>
                        )}
                    </div>
                </div>

                {!viewMode ? (
                    !isReviewMode ? (
                        <FormActions onSave={handleSave} onDraft={handleDraft} onCancel={handleCancel} />
                    ) : (
                        <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-[#F6F3F2] backdrop-blur-md border-t border-[#E5E2E1]/60 p-4 px-10 flex items-center justify-end z-40 gap-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                            <button 
                                onClick={() => setIsReviewMode(false)}
                                className="text-base font-bold text-[#5C403D] hover:text-[#ED393C] transition-all px-6 py-2"
                            >
                                ย้อนกลับ
                            </button>
                            <button 
                                onClick={handleFinalConfirm}
                                className="bg-logout-gradient leading-none text-white px-10 h-[52px] rounded-xl font-black text-base shadow-xl shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all"
                            >
                                ยืนยันข้อมูล RoPA
                            </button>
                        </div>
                    )
                ) : (
                    <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-[#F6F3F2] backdrop-blur-md border-t border-[#E5E2E1]/60 p-4 px-10 flex items-center justify-center z-40 gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="bg-[#1B1C1C] text-white px-12 h-[52px] rounded-xl font-bold text-base shadow-lg hover:opacity-90 transition-all active:scale-95"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                )}

                {/* Final Success Modal */}
                {isSuccessModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-[#1B1C1C]/40 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-[560px] rounded-[48px] shadow-2xl p-16 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                            <div className="space-y-5 w-full">
                                <h2 className="text-4xl font-headline font-black text-[#1B1C1C] tracking-tight leading-tight whitespace-nowrap">
                                    บันทึกรายการ RoPA เสร็จสิ้น
                                </h2>
                                <p className="text-lg font-bold text-[#5F5E5E] leading-relaxed max-w-[420px] mx-auto pb-4">
                                    สามารถจัดการข้อมูลผ่านรายการ RoPA ที่บันทึกไว้
                                </p>
                                
                                <button 
                                    onClick={() => router.push("/data-owner/management")}
                                    className="bg-logout-gradient leading-none text-white w-full h-[56px] rounded-2xl font-black text-lg shadow-lg shadow-[#ED393C]/20 hover:brightness-110 transition-all active:scale-95"
                                >
                                    กลับสู่หน้ารายการ RoPA
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function ManagementFormPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-surface-container-low">
                <div className="text-secondary font-bold animate-pulse text-lg">กำลังโหลด...</div>
            </div>
        }>
            <ManagementFormContent />
        </Suspense>
    );
}

export default ManagementFormPage;


