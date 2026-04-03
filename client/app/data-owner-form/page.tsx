"use client";

import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import Stepper from "@/components/layouts/Stepper";
import FormActions from "@/components/layouts/FormActions";
import Section1GeneralInfo from "@/components/controllerSections/Section1GeneralInfo";
import Section2ActivityDetails from "@/components/controllerSections/Section2ActivityDetails";
import Section3Stored from "@/components/controllerSections/Section3Stored";
import Section4Retention from "@/components/controllerSections/Section4Retention";
import Section5Legal from "@/components/controllerSections/Section5Legal";
import Section6TOMs from "@/components/controllerSections/Section6TOMs";
import { OwnerRecord } from "@/types/dataOwner";
import { useState, useEffect } from "react";

export default function Page() {
    const [form, setForm] = useState<Partial<OwnerRecord>>({
        title: "",
        firstName: "",
        lastName: "",
        address: "",
        email: "",
        phoneNumber: "",
        status: "draft",
        id: crypto.randomUUID(),
        dataSource: { direct: false, indirect: false },
        minorConsent: { under10: false, age10to20: false, none: false },
        internationalTransfer: { isTransfer: false },
        dataCategories: [],
        storedDataTypes: [],
        storedDataTypesOther: "",
        retention: { 
            storageType: "soft file", 
            method: [], 
            duration: 0, 
            unit: "year",
            accessControl: "", 
            deletionMethod: "" 
        },
        securityMeasures: {}
    });
    
    const initialFormState = { ...form, id: crypto.randomUUID() };

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load draft from localStorage on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem("ropa_draft");
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setForm(prev => ({ ...prev, ...parsed }));
                console.log("Draft loaded from localStorage");
            } catch (e) {
                console.error("Failed to parse draft from localStorage", e);
            }
        }
    }, []);

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

        // Section 1
        if (!form.title) newErrors.title = "กรุณาเลือกคำนำหน้า";
        if (!form.firstName) newErrors.firstName = "กรุณากรอกชื่อ";
        if (!form.lastName) newErrors.lastName = "กรุณากรอกนามสกุล";
        if (!form.address) newErrors.address = "กรุณากรอกที่อยู่";
        if (!form.email) newErrors.email = "กรุณากรอกอีเมล";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
        if (!form.phoneNumber) newErrors.phoneNumber = "กรุณากรอกเบอร์โทรศัพท์";
        else if (!/^[0-9]{10}$/.test(form.phoneNumber)) newErrors.phoneNumber = "เบอร์โทรศัพท์ต้องมี 10 หลัก";

        // Section 2
        if (!form.dataSubjectName) newErrors.dataSubjectName = "กรุณากรอกชื่อเจ้าของข้อมูลส่วนบุคคล";
        if (!form.processingActivity) newErrors.processingActivity = "กรุณากรอกกิจกรรมประมวลผล";
        if (!form.purpose) newErrors.purpose = "กรุณากรอกวัตถุประสงค์การประมวลผล";

        // Section 3
        if (!form.storedDataTypes || form.storedDataTypes.length === 0) newErrors.storedDataTypes = "กรุณาเลือกข้อมูลส่วนบุคคลอย่างน้อย 1 รายการ";
        if (form.storedDataTypes?.includes("อื่นๆ") && !form.storedDataTypesOther) newErrors.storedDataTypesOther = "กรุณาระบุข้อมูลส่วนบุคคลอื่นๆ";
        if (!form.dataCategories || form.dataCategories.length === 0) newErrors.dataCategories = "กรุณาเลือกหมวดหมู่ของข้อมูลอย่างน้อย 1 รายการ";
        if (!form.dataType) newErrors.dataType = "กรุณาเลือกประเภทของข้อมูล";

        // Section 4
        if (!form.collectionMethod) newErrors.collectionMethod = "กรุณาเลือกวิธีการได้มาซึ่งข้อมูล";
        if (!form.dataSource?.direct && !form.dataSource?.indirect) newErrors.dataSource = "กรุณาเลือกแหล่งที่ได้มาอย่างน้อย 1 แหล่ง";
        if (!form.retention?.storageType) newErrors.storageType = "กรุณาเลือกประเภทของข้อมูลที่จัดเก็บ";
        if (!form.retention?.method || form.retention?.method.length === 0) newErrors.retentionMethod = "กรุณาเลือกวิธีการเก็บรักษาข้อมูล";
        if (!form.retention?.duration || form.retention?.duration <= 0) newErrors.retentionDuration = "กรุณาระบุระยะเวลาการเก็บรักษาข้อมูล";
        if (!form.retention?.accessControl) newErrors.accessControl = "กรุณาระบุสิทธิและวิธีการเข้าถึงข้อมูล";
        if (!form.retention?.deletionMethod) newErrors.deletionMethod = "กรุณาระบุวิธีการลบหรือทำลายข้อมูล";

        // Section 5
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

        // Section 6 - (Optional, removed requirement)

        setErrors(newErrors);
        
        if (Object.keys(newErrors).length > 0) {
            // Scroll to first error
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
                // If it's a single checkbox with a specific value, store the value if checked, else clear it
                // If it's just a boolean toggle (value is "on"), store checked
                val = (value && value !== "on") ? (checked ? value : "") : checked;
            }
        }
        
        // Convert "true"/"false" strings to boolean for specific fields
        if (typeof val === "string") {
            if (val.toLowerCase() === "true") val = true;
            else if (val.toLowerCase() === "false") val = false;
        }

        // Validate on change for email and phone
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

        // Section 1: General Info
        if (form.title && form.firstName && form.lastName && form.address && form.email && form.phoneNumber && !errors.email && !errors.phoneNumber) {
            completed.push(1);
        }

        // Section 2: Activity Details
        if (form.dataSubjectName && form.processingActivity && form.purpose) {
            completed.push(2);
        }

        // Section 3: Stored Data
        if (
            form.dataCategories && form.dataCategories.length > 0 &&
            form.dataType &&
            form.storedDataTypes && form.storedDataTypes.length > 0
        ) {
            completed.push(3);
        }

        // Section 4: Retention
        if (
            form.collectionMethod && 
            form.retention?.duration && 
            form.retention?.unit && 
            form.retention?.accessControl && 
            form.retention?.deletionMethod
        ) {
            completed.push(4);
        }

        // Section 5: Legal
        const isTransferComplete = form.internationalTransfer?.isTransfer === false || 
            (form.internationalTransfer?.isTransfer === true && form.internationalTransfer?.country && form.internationalTransfer?.transferMethod);
        
        if (form.legalBasis && isTransferComplete && form.exemptionDisclosure) {
            completed.push(5);
        }

        // Section 6: TOMs
        const sm = form.securityMeasures;
        if (sm?.organizational && sm?.accessControl && sm?.technical && sm?.responsibility && sm?.physical && sm?.audit) {
            completed.push(6);
        }

        return completed;
    };

    const completedSteps = getCompletedSteps();

    const handleSave = () => {
        if (validateForm()) {
            console.log("Finalizing and Saving Record:", form);
            alert("บันทึกข้อมูลเรียบร้อยแล้ว");
        }
    };

    const handleCancel = () => {
        if (confirm("คุณต้องการยกเลิกการกรอกข้อมูลใช่หรือไม่? ข้อมูลที่ยังไม่ได้บันทึกจะหายไป")) {
            setForm(initialFormState);
            setErrors({});
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDraft = () => {
        const draftData = { ...form, status: "draft" };
        console.log("Saving Draft to Local Storage:", draftData);
        localStorage.setItem("ropa_draft", JSON.stringify(draftData));
        alert("บันทึกฉบับร่างเรียบร้อยแล้วในเบราว์เซอร์");
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar - Fixed */}
            <Sidebar />

            {/* Main Content - Flex-1 with margin for sidebar */}
            <main className="flex-1 ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
                {/* Header Section */}
                <TopBar />

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 pb-36 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-1000">
                    <Stepper completedSteps={completedSteps} />

                    {/* Stacking All 6 Sections */}
                    <div className="space-y-8">
                        <Section1GeneralInfo form={form} handleChange={handleChange} errors={errors} />
                        <Section2ActivityDetails form={form} handleChange={handleChange} errors={errors} />
                        <Section3Stored form={form} handleChange={handleChange} errors={errors} />
                        <Section4Retention form={form} handleChange={handleChange} errors={errors} />
                        <Section5Legal form={form} handleChange={handleChange} errors={errors} />
                        <Section6TOMs form={form} handleChange={handleChange} errors={errors} />
                    </div>

                    <div className="h-10"></div>
                </div>

                {/* Sticky Footer Actions */}
                <FormActions onSave={handleSave} onDraft={handleDraft} onCancel={handleCancel} />
            </main>
        </div>
    );
}
