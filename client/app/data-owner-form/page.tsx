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
import { useState } from "react";

export default function Page() {
    const [form, setForm] = useState<Partial<OwnerRecord>>({
        recordName: "",
        address: "",
        email: "",
        phoneNumber: "",
        id: crypto.randomUUID(),
        dataSource: { direct: false, indirect: false },
        minorConsent: { under10: false, age10to20: false },
        internationalTransfer: { isTransfer: false },
        dataCategories: [],
        storedDataTypes: [],
        storedDataTypesOther: "",
        retention: { 
            storageType: "soft file", 
            method: "", 
            duration: 0, 
            unit: "year",
            accessControl: "", 
            deletionMethod: "" 
        },
        securityMeasures: {}
    });

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        
        let val: any = type === "checkbox" ? checked : value;
        
        // Convert "true"/"false" strings to boolean for specific fields
        if (typeof val === "string") {
            if (val.toLowerCase() === "true") val = true;
            else if (val.toLowerCase() === "false") val = false;
            else if (val === "") val = null; // Toggle off Case
        }

        setForm((prev: any) => {
            const keys = name.split(".");
            
            if (name.endsWith("[]")) {
                const arrayKey = name.slice(0, -2);
                const currentArray = prev[arrayKey] || [];
                const newArray = checked 
                    ? [...currentArray, value]
                    : currentArray.filter((v: string) => v !== value);
                return { ...prev, [arrayKey]: newArray };
            }

            if (keys.length === 1) {
                return { ...prev, [name]: val };
            }

            const [parent, child] = keys;
            return {
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: val
                }
            };
        });
    };

    const getCompletedSteps = () => {
        const completed = [];

        // Section 1: General Info
        if (form.recordName && form.address && form.email && form.phoneNumber) {
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
        console.log("Finalizing and Saving Record:", form);
        alert("บันทึกข้อมูลเรียบร้อยแล้ว (Mock)");
    };

    const handleDraft = () => {
        console.log("Saving Draft:", form);
        alert("บันทึกฉบับร่างเรียบร้อยแล้ว (Mock)");
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
                        <Section1GeneralInfo form={form} handleChange={handleChange} />
                        <Section2ActivityDetails form={form} handleChange={handleChange} />
                        <Section3Stored form={form} handleChange={handleChange} />
                        <Section4Retention form={form} handleChange={handleChange} />
                        <Section5Legal form={form} handleChange={handleChange} />
                        <Section6TOMs form={form} handleChange={handleChange} />
                    </div>

                    <div className="h-10"></div>
                </div>

                {/* Sticky Footer Actions */}
                <FormActions onSave={handleSave} onDraft={handleDraft} />
            </main>
        </div>
    );
}
