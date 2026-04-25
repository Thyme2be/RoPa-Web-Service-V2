"use client";

import Stepper from "@/components/layouts/Stepper";
import GeneralInfo from "@/components/formSections/GeneralInfo";
import ActivityDetails from "@/components/formSections/ActivityDetails";
import StoredInfo from "@/components/formSections/StoredInfo";
import RetentionInfo from "@/components/formSections/RetentionInfo";
import LegalInfo from "@/components/formSections/LegalInfo";
import SecurityMeasures from "@/components/formSections/SecurityMeasures";
import RightsChannel from "@/components/formSections/RightsChannel";
import DpoRiskAssessment from "@/components/ropa/DpoRiskAssessment";
import SaveSuccessModal from "@/components/ui/SaveSuccessModal";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { OwnerRecord } from "@/types/dataOwner";
import { ProcessorRecord } from "@/types/dataProcessor";
import { RopaStatus } from "@/types/enums";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/** Local Tabs Component for DPO (No status dots to avoid conflict) */
function DpoFormTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const tabs = [
    { id: "owner", label: "ส่วนของผู้รับผิดชอบข้อมูล" },
    { id: "processor", label: "ส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล" },
    { id: "risk", label: "การประเมินความเสี่ยงของเอกสาร" },
  ];

  return (
    <div className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar bg-[#F6F6F6] p-2 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "h-11 px-6 rounded-lg font-bold text-[14px] transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-1 cursor-pointer",
            activeTab === tab.id
              ? "bg-[#ED393C] text-white shadow-md"
              : "bg-white text-[#1B1C1C] border border-[#E5E2E1] hover:bg-gray-50",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Local version of ActivityDetails to allow custom numbering (Part 3)
 */
function LocalActivityDetails({
  form,
  handleChange,
  errors,
  disabled,
  variant = "owner",
}: any) {
  const isProcessor = variant === "processor";
  const primaryColor = isProcessor ? "#00666E" : "#ED393C";
  const markerColor = "#ED393C";
  const lightBg = isProcessor ? "bg-[#00666E]/10" : "bg-[#ED393C]/10";
  const borderLColor = isProcessor
    ? "border-l-[#00666E]"
    : "border-l-[#ED393C]";

  // Changing "ส่วนที่ 2" to "ส่วนที่ 3" specifically for this page
  const sectionTitle = isProcessor
    ? "ส่วนที่ 2 : รายละเอียดกิจกรรม"
    : "ส่วนที่ 3 : รายละเอียดของกิจกรรมและวัตถุประสงค์";

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border-l-[6px] overflow-hidden",
        borderLColor,
      )}
    >
      <div className="flex items-center gap-4 px-8 py-6">
        <div
          className={cn(
            "p-2.5 rounded-xl flex items-center justify-center",
            lightBg,
          )}
        >
          <span
            className="material-symbols-outlined text-2xl font-bold"
            style={{ color: primaryColor }}
          >
            accessibility_new
          </span>
        </div>
        <h2 className="font-bold text-[18px] text-[#1B1C1C] tracking-tight">
          {sectionTitle}
        </h2>
      </div>

      <div className="px-8 pb-8 space-y-6">
        {!isProcessor ? (
          <>
            <div className="grid grid-cols-1">
              <Input
                label="ชื่อเจ้าของข้อมูลส่วนบุคคล"
                name="data_subject_name"
                value={form?.data_subject_name || ""}
                placeholder="ไม่มีข้อมูล"
                onChange={handleChange}
                disabled={disabled}
                focusColor={primaryColor}
                requiredColor={markerColor}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <Input
                label="กิจกรรมประมวลผล"
                name="processing_activity"
                value={form?.processing_activity || ""}
                placeholder="ไม่มีข้อมูล"
                onChange={handleChange}
                disabled={disabled}
                focusColor={primaryColor}
                requiredColor={markerColor}
              />
              <Input
                label="วัตถุประสงค์การประมวลผล"
                name="purpose_of_processing"
                value={form?.purpose_of_processing || form?.purpose || ""}
                placeholder="ไม่มีข้อมูล"
                onChange={handleChange}
                disabled={disabled}
                focusColor={primaryColor}
                requiredColor={markerColor}
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Input
              label="ชื่อผู้ประมวลผลข้อมูลส่วนบุคคล"
              name="processor_name"
              value={form?.processor_name || ""}
              placeholder="ไม่มีข้อมูล"
              onChange={handleChange}
              disabled={disabled}
              focusColor={primaryColor}
              requiredColor={markerColor}
            />
            <Input
              label="ที่อยู่ผู้ควบคุมข้อมูลส่วนบุคคล"
              name="controllerAddress"
              value={form?.controllerAddress || ""}
              placeholder="ไม่มีข้อมูล"
              onChange={handleChange}
              disabled={disabled}
              focusColor={primaryColor}
              requiredColor={markerColor}
            />
            <Input
              label="กิจกรรมประมวลผล"
              name="processing_activity"
              value={form?.processing_activity || ""}
              placeholder="ไม่มีข้อมูล"
              onChange={handleChange}
              disabled={disabled}
              focusColor={primaryColor}
              requiredColor={markerColor}
            />
            <Input
              label="วัตถุประสงค์ของการประมวลผล"
              name="purpose_of_processing"
              value={form?.purpose_of_processing || form?.purpose || ""}
              placeholder="ไม่มีข้อมูล"
              onChange={handleChange}
              disabled={disabled}
              focusColor={primaryColor}
              requiredColor={markerColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * DPO Management Form Page (Detail View)
 * Located at: client/app/dpo/tables/in-progress/[id]/page.tsx
 * Allows DPO to view document details and provide feedback.
 */
function DpoInProgressDetailContent() {
  const router = useRouter();
  const params = useParams();
  const recordId = params?.id as string;

  const [activeTab, setActiveTab] = useState("owner");
  const [riskDocView, setRiskDocView] = useState<
    "none" | "owner" | "processor"
  >("none");
  const [openFeedbackSections, setOpenFeedbackSections] = useState<string[]>(
    [],
  );
  const [sectionFeedbacks, setSectionFeedbacks] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<OwnerRecord>>({
    document_name: "กำลังโหลด...",
    status: RopaStatus.Processing,
  });

  const [processorForm, setProcessorForm] = useState<Partial<ProcessorRecord>>({
    status: RopaStatus.Draft,
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!recordId) return;
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/owner/documents/${recordId}/section`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!response.ok) throw new Error("Failed to fetch document");
        const docData = await response.json();

        // Helper to extract string values from array of objects
        const extractArr = (arr: any, key: string) =>
          Array.isArray(arr)
            ? arr.map((i: any) =>
                typeof i === "object" && i !== null ? i[key] : i,
              )
            : arr;

        // Helper to map Risk Assessment to frontend format
        const mapRisk = (risk: any) => {
          if (!risk) return undefined;
          return {
            probability: risk.likelihood || risk.probability || 0,
            impact: risk.impact || 0,
            total: risk.risk_score || risk.total || 0,
            level: risk.risk_level === "LOW" ? "ความเสี่ยงต่ำ" : risk.risk_level === "MEDIUM" ? "ความเสี่ยงปานกลาง" : risk.risk_level === "HIGH" ? "ความเสี่ยงสูง" : risk.level || "",
            submitted_date: risk.assessed_at || risk.submitted_date
          };
        };

        // Map Owner Section (Full mapping)
        const os = docData.owner_sections?.[0] || docData;
        setForm((prev) => ({
          ...prev,
          ...os, // Direct map all fields (General, Stored, Retention, etc.)
          id: recordId,
          document_name: docData.title || os.document_name,
          data_subject_name:
            os.data_subject_name ||
            `${os.title_prefix || ""} ${os.first_name || ""} ${os.last_name || ""}`.trim() ||
            os.data_owner_name,
          rights_email:
            os.contact_email ||
            docData.contact_email ||
            os.rights_email ||
            docData.rights_email,
          rights_phone:
            os.company_phone ||
            docData.company_phone ||
            os.rights_phone ||
            docData.rights_phone,
          processing_activity: os.processing_activity,
          purpose_of_processing: os.purpose_of_processing || os.purpose,
          status: docData.status as RopaStatus,
          risk_assessment: mapRisk(docData.risk_assessment || os.risk_assessment),
          processing_status: { do_status: "done", dp_status: "done" },
          // Map array items to strings
          personal_data_items: extractArr(os.personal_data_items, "type"),
          data_categories: extractArr(os.data_categories, "category"),
          data_types: extractArr(os.data_types, "type"),
          collection_methods: extractArr(os.collection_methods, "method"),
          collection_method:
            extractArr(os.collection_methods, "method")?.[0] || "",
          data_sources: extractArr(os.data_sources, "source"),
          data_source_direct:
            extractArr(os.data_sources, "source")?.some(
              (s: string) => s?.toLowerCase?.() === "direct",
            ) || false,
          data_source_indirect:
            extractArr(os.data_sources, "source")?.some(
              (s: string) => s?.toLowerCase?.() === "indirect",
            ) || false,
          data_source_other: os.data_source_other || "",
          storage_types: extractArr(os.storage_types, "type"),
          storage_methods: extractArr(os.storage_methods, "method"),
        }));

        // Map Processor Section (Full mapping)
        const processorResponse = await fetch(
          `${API_BASE_URL}/owner/documents/${recordId}/processor-section`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!processorResponse.ok)
          throw new Error("Failed to fetch processor document");
        const docProcessorData = await processorResponse.json();

        const ps =
          docProcessorData.processor_sections &&
          docProcessorData.processor_sections.length > 0
            ? docProcessorData.processor_sections[0]
            : docProcessorData;

        if (ps && Object.keys(ps).length > 0 && !ps.detail) {
          setProcessorForm((prev) => ({
            ...prev,
            ...ps, // Direct map all fields
            id: recordId,
            processor_name: ps.processor_name,
            controllerAddress: ps.controller_address || ps.controllerAddress,
            processing_activity: ps.processing_activity,
            purpose_of_processing: ps.purpose_of_processing || ps.purpose,
            status: (docProcessorData.status || ps.status) as RopaStatus,
            // Map array items to strings
            personal_data_items: extractArr(ps.personal_data_items, "type"),
            data_categories: extractArr(ps.data_categories, "category"),
            data_types: extractArr(ps.data_types, "type"),
            collection_methods: extractArr(ps.collection_methods, "method"),
            data_sources: extractArr(ps.data_sources, "source"),
            storage_types: extractArr(ps.storage_types, "type"),
            storage_methods: extractArr(ps.storage_methods, "method"),
          }));
        }

        // Map Risk Assessment
        try {
          const riskResponse = await fetch(
            `${API_BASE_URL}/owner/documents/${recordId}/risk`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (riskResponse.ok) {
            const riskData = await riskResponse.json();
            if (riskData && Object.keys(riskData).length > 0) {
              setForm((prev) => ({
                ...prev,
                risk_assessment: mapRisk(riskData),
              }));
            }
          }
        } catch (err) {
          console.error("Failed to fetch risk assessment:", err);
        }
      } catch (err: any) {
        console.error("Fetch detail error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [recordId]);

  const tabs = ["owner", "processor", "risk"];

  const toggleFeedback = (section: string) => {
    setOpenFeedbackSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const handleNextTab = async () => {
    // Save drafts when moving between tabs
    await saveComments(false);

    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/dpo/tables/in-progress");
    }
  };

  const handleCancel = () => {
    router.push("/dpo/tables/in-progress");
  };

  const DO_KEY_MAP: Record<string, string> = {
    "ข้อมูลทั่วไป (DO)": "DO_SEC_1",
    "ชื่อกิจกรรมและวัตถุประสงค์ (DO)": "DO_SEC_2",
    "รายละเอียดกิจกรรม (DO)": "DO_SEC_2",
    "รายละเอียดของกิจกรรมและวัตถุประสงค์ (DO)": "DO_SEC_3",
    "ข้อมูลที่จัดเก็บ (DO)": "DO_SEC_4",
    "ระยะเวลาการเก็บรักษา (DO)": "DO_SEC_5",
    "ฐานทางกฎหมาย (DO)": "DO_SEC_6",
    "มาตรการรักษาความปลอดภัย (DO)": "DO_SEC_7",
    "ช่องทางการใช้สิทธิของเจ้าของข้อมูล (DO)": "DO_SEC_8",
    การประเมินความเสี่ยง: "DO_RISK",
  };

  const DP_KEY_MAP: Record<string, string> = {
    "ข้อมูลทั่วไป (DP)": "DP_SEC_1",
    "กิจกรรมประมวลผล (DP)": "DP_SEC_2",
    "ข้อมูลที่จัดเก็บ (DP)": "DP_SEC_3",
    "ระยะเวลาการเก็บรักษา (DP)": "DP_SEC_4",
    "ฐานทางกฎหมาย (DP)": "DP_SEC_5",
    "มาตรการรักษาความปลอดภัย (DP)": "DP_SEC_6",
  };

  const saveComments = async (isFinal: boolean) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const doComments = Object.entries(sectionFeedbacks)
      .filter(([key, text]) => DO_KEY_MAP[key] && text.trim() !== "")
      .map(([key, text]) => ({
        section_key: DO_KEY_MAP[key],
        comment: text,
      }));

    const dpComments = Object.entries(sectionFeedbacks)
      .filter(([key, text]) => DP_KEY_MAP[key] && text.trim() !== "")
      .map(([key, text]) => ({
        section_key: DP_KEY_MAP[key],
        comment: text,
      }));

    const promises = [];

    // Save DO group if has comments or if it's the final submission
    if (doComments.length > 0 || isFinal) {
      promises.push(
        fetch(`${API_BASE_URL}/dashboard/dpo/documents/${recordId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            group: "DO",
            comments: doComments,
            is_final: isFinal,
          }),
        }),
      );
    }

    // Save DP group if has comments
    if (dpComments.length > 0) {
      promises.push(
        fetch(`${API_BASE_URL}/dashboard/dpo/documents/${recordId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            group: "DP",
            comments: dpComments,
            is_final: false,
          }),
        }),
      );
    }

    try {
      await Promise.all(promises);
    } catch (err) {
      console.error("Save comments error:", err);
    }
  };

  const handleConfirmReview = async () => {
    setIsSubmitting(true);
    try {
      await saveComments(true);
      setIsConfirmModalOpen(false);
      router.push("/dpo/tables/in-progress");
    } catch (err: any) {
      console.error("Submit review error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastTab = activeTab === tabs[tabs.length - 1];
  const emptyHandler = () => {};

  if (loading)
    return (
      <div className="p-8 text-[#5F5E5E] animate-pulse font-bold">
        กำลังโหลด...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-[#ED393C] font-bold">
        เกิดข้อผิดพลาด: {error}
      </div>
    );

  const renderOwnerSections = () => (
    <div className="space-y-12">
      {[
        { title: "ข้อมูลทั่วไป", component: GeneralInfo },
        { title: "ช่องทางใช้สิทธิ", component: RightsChannel },
        { title: "กิจกรรมประมวลผล", component: LocalActivityDetails },
        { title: "ข้อมูลที่จัดเก็บ", component: StoredInfo },
        { title: "ระยะเวลาการเก็บรักษา", component: RetentionInfo },
        { title: "ฐานทางกฎหมาย", component: LegalInfo },
        { title: "มาตรการรักษาความปลอดภัย", component: SecurityMeasures },
      ].map((sec, idx) => (
        <div key={idx} className="flex flex-col gap-4">
          {openFeedbackSections.includes(sec.title) && (
            <div className="bg-white rounded-[20px] shadow-sm border-l-[6px] border-l-[#ED393C] p-6 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-[#F6F3F2]/60 rounded-xl p-4">
                <textarea
                  className="w-full bg-transparent border-none outline-none text-[#5C403D] font-medium placeholder:text-[#5C403D]/40 resize-none min-h-[40px]"
                  placeholder="ระบุข้อเสนอแนะสำหรับผู้รับผิดชอบข้อมูล"
                  value={sectionFeedbacks[sec.title] || ""}
                  onChange={(e) =>
                    setSectionFeedbacks((prev) => ({
                      ...prev,
                      [sec.title]: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}

          <div className="relative group">
            <button
              onClick={() => toggleFeedback(sec.title)}
              className={cn(
                "absolute top-5 right-5 z-10 w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer",
                openFeedbackSections.includes(sec.title)
                  ? "bg-[#ED393C] text-white"
                  : "bg-[#F6F3F2] text-[#5C403D] hover:bg-[#E5E2E1]",
              )}
            >
              <span className="material-symbols-outlined text-[20px]">
                {openFeedbackSections.includes(sec.title) ? "close" : "comment"}
              </span>
            </button>
            <sec.component
              form={form}
              handleChange={emptyHandler}
              errors={{}}
              disabled={true}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderProcessorSections = () => (
    <div className="space-y-12">
      {[
        { title: "ข้อมูลทั่วไป (DP)", component: GeneralInfo },
        { title: "กิจกรรมประมวลผล (DP)", component: LocalActivityDetails },
        { title: "ข้อมูลที่จัดเก็บ (DP)", component: StoredInfo },
        { title: "ระยะเวลาการเก็บรักษา (DP)", component: RetentionInfo },
        { title: "ฐานทางกฎหมาย (DP)", component: LegalInfo },
        { title: "มาตรการรักษาความปลอดภัย (DP)", component: SecurityMeasures },
      ].map((sec, idx) => (
        <div key={idx} className="flex flex-col gap-4">
          {openFeedbackSections.includes(sec.title) && (
            <div className="bg-white rounded-[20px] shadow-sm border-l-[6px] border-l-[#00666E] p-6 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-[#F6F3F2]/60 rounded-xl p-4">
                <textarea
                  className="w-full bg-transparent border-none outline-none text-[#5C403D] font-medium placeholder:text-[#5C403D]/40 resize-none min-h-[40px]"
                  placeholder="ระบุข้อเสนอแนะสำหรับส่วนผู้ประมวลผลข้อมูล"
                  value={sectionFeedbacks[sec.title] || ""}
                  onChange={(e) =>
                    setSectionFeedbacks((prev) => ({
                      ...prev,
                      [sec.title]: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}

          <div className="relative group">
            <button
              onClick={() => toggleFeedback(sec.title)}
              className={cn(
                "absolute top-5 right-5 z-10 w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer",
                openFeedbackSections.includes(sec.title)
                  ? "bg-[#00666E] text-white"
                  : "bg-[#F6F3F2] text-[#5C403D] hover:bg-[#E5E2E1]",
              )}
            >
              <span className="material-symbols-outlined text-[20px]">
                {openFeedbackSections.includes(sec.title) ? "close" : "comment"}
              </span>
            </button>
            <sec.component
              form={processorForm}
              handleChange={emptyHandler}
              errors={{}}
              disabled={true}
              variant="processor"
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 space-y-6 animate-in fade-in duration-700">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-6 px-1">
          <div className="flex-1">
            <DpoFormTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {activeTab === "owner" && (
          <div className="space-y-8 pb-32">{renderOwnerSections()}</div>
        )}

        {activeTab === "processor" && (
          <div className="space-y-8 pb-32">{renderProcessorSections()}</div>
        )}

        {activeTab === "risk" && (
          <div className="mt-4 pb-32 space-y-8">
            <DpoRiskAssessment
              key={recordId}
              doStatus="done"
              dpStatus="done"
              existingRisk={form.risk_assessment as any}
              activeView={riskDocView}
              onViewDoSection={() =>
                setRiskDocView((prev) => (prev === "owner" ? "none" : "owner"))
              }
              onViewDpSection={() =>
                setRiskDocView((prev) =>
                  prev === "processor" ? "none" : "processor",
                )
              }
              onSubmit={emptyHandler}
              onCancel={() => setActiveTab("owner")}
              readOnly={true}
              isFeedbackOpen={openFeedbackSections.includes(
                "การประเมินความเสี่ยง",
              )}
              onToggleFeedback={() => toggleFeedback("การประเมินความเสี่ยง")}
            />

            {openFeedbackSections.includes("การประเมินความเสี่ยง") && (
              <div className="bg-white rounded-[20px] shadow-sm border-l-[6px] border-l-[#ED393C] p-6 animate-in slide-in-from-top-4 duration-300">
                <div className="bg-[#F6F3F2]/60 rounded-xl p-4">
                  <textarea
                    className="w-full bg-transparent border-none outline-none text-[#5C403D] font-medium placeholder:text-[#5C403D]/40 resize-none min-h-[40px]"
                    placeholder="ระบุข้อเสนอแนะสำหรับการประเมินความเสี่ยง"
                    value={sectionFeedbacks["การประเมินความเสี่ยง"] || ""}
                    onChange={(e) =>
                      setSectionFeedbacks((prev) => ({
                        ...prev,
                        ["การประเมินความเสี่ยง"]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {riskDocView === "owner" && (
              <div className="animate-in slide-in-from-top-4 duration-500 space-y-8">
                <hr className="border-[#E5E2E1] my-8" />
                <h3 className="text-xl font-black text-[#1B1C1C]">
                  ข้อมูลส่วนของผู้รับผิดชอบข้อมูล
                </h3>
                {renderOwnerSections()}
              </div>
            )}

            {riskDocView === "processor" && (
              <div className="animate-in slide-in-from-top-4 duration-500 space-y-8">
                <hr className="border-[#E5E2E1] my-8" />
                <h3 className="text-xl font-black text-[#1B1C1C]">
                  ข้อมูลส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล
                </h3>
                {renderProcessorSections()}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-[#F6F3F2] border-t border-[#E5E2E1] p-5 px-10 flex items-center justify-between z-40">
        <button
          onClick={handleCancel}
          className="px-10 h-[52px] rounded-2xl font-bold text-[#5C403D] border border-[#E5E2E1] hover:bg-gray-50 transition-all cursor-pointer shadow-md"
        >
          ยกเลิก
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevTab}
            className="px-10 h-[52px] rounded-2xl font-bold text-[#5C403D] border border-[#E5E2E1] hover:bg-gray-50 transition-all cursor-pointer shadow-md"
          >
            ย้อนกลับ
          </button>

          {isLastTab ? (
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="bg-logout-gradient leading-none text-white px-10 h-[52px] rounded-2xl font-black text-base shadow-2xl shadow-red-900/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              ยืนยันการตรวจสอบ
            </button>
          ) : (
            <button
              onClick={handleNextTab}
              className="bg-logout-gradient leading-none text-white px-10 h-[52px] rounded-2xl font-black text-base shadow-2xl shadow-red-900/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              ถัดไป
            </button>
          )}
        </div>
      </div>

      <SaveSuccessModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmReview}
        isLoading={isSubmitting}
        title="ยืนยันการตรวจสอบ"
        subtitle={
          Object.keys(sectionFeedbacks).some(
            (k) => sectionFeedbacks[k].trim() !== "",
          )
            ? "คุณมีข้อเสนอแนะ ระบบจะส่งกลับไปให้ผู้รับผิดชอบแก้ไข"
            : "ยืนยันการตรวจสอบว่าถูกต้องครบถ้วนแล้ว"
        }
        buttonText={isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันการตรวจสอบ"}
      />
    </div>
  );
}

export default function DPOInProgressDetailPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-[#5F5E5E]">กำลังโหลด...</div>}
    >
      <DpoInProgressDetailContent />
    </Suspense>
  );
}
