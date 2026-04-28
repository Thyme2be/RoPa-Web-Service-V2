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
import SectionCommentBox from "@/components/ropa/SectionCommentBox";
import { ActionIconWithTooltip } from "@/components/ropa/ListComponents";
import SaveSuccessModal from "@/components/ui/SaveSuccessModal";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
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
    { id: "destruction", label: "คำร้องขอทำลาย" },
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
  hideHeader = false,
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
    <div className="space-y-6">
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
  );
}

const DO_KEY_MAP: Record<string, string> = {
  "ข้อมูลทั่วไป": "DO_SEC_1",
  "ช่องทางใช้สิทธิ": "DO_SEC_2",
  "กิจกรรมประมวลผล": "DO_SEC_3",
  "ข้อมูลที่จัดเก็บ": "DO_SEC_4",
  "ระยะเวลาการเก็บรักษา": "DO_SEC_5",
  "ฐานทางกฎหมาย": "DO_SEC_6",
  "มาตรการรักษาความปลอดภัย": "DO_SEC_7",
  "การประเมินความเสี่ยง": "DO_RISK",
};

const DP_KEY_MAP: Record<string, string> = {
  "ข้อมูลทั่วไป (DP)": "DP_SEC_1",
  "กิจกรรมประมวลผล (DP)": "DP_SEC_2",
  "ข้อมูลที่จัดเก็บ (DP)": "DP_SEC_3",
  "ระยะเวลาการเก็บรักษา (DP)": "DP_SEC_4",
  "ฐานทางกฎหมาย (DP)": "DP_SEC_5",
  "มาตรการรักษาความปลอดภัย (DP)": "DP_SEC_6",
};

const REVERSE_DO_KEY_MAP: Record<string, string> = {
  ...Object.fromEntries(Object.entries(DO_KEY_MAP).map(([k, v]) => [v, k])),
  risk: "การประเมินความเสี่ยง",
};

const REVERSE_DP_KEY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(DP_KEY_MAP).map(([k, v]) => [v, k]),
);

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
  const [sectionCommentHistory, setSectionCommentHistory] = useState<
    Record<string, { text: string; date?: string; reviewer?: string }[]>
  >({});
  const [isAwaitingResubmission, setIsAwaitingResubmission] = useState(false);
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
  const [destructionDecision, setDestructionDecision] = useState<
    "APPROVED" | "REJECTED" | ""
  >("");
  const [destructionRejectReason, setDestructionRejectReason] = useState("");
  const getAccessToken = () =>
    localStorage.getItem("token")?.replace(/^"|"$/g, "").trim() || "";

  useEffect(() => {
    const fetchDetail = async () => {
      if (!recordId) return;
      setLoading(true);
      setIsAwaitingResubmission(false);
      setSectionCommentHistory({});
      const token = getAccessToken();
      if (!token) {
        setError("No token found");
        setLoading(false);
        return;
      }

      try {
        let loadedAnySection = false;
        const response = await fetch(
          `${API_BASE_URL}/owner/documents/${recordId}/section`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        let docData: any = null;
        if (!response.ok) {
          // Soft-fail: owner section may be temporarily unavailable for some records.
          // Continue loading processor/risk/comments so DPO page can still open.
          console.warn("Failed to fetch owner section", response.status);
        } else {
          docData = await response.json();
        }

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
        if (docData) {
          loadedAnySection = true;
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
            // Map field name mismatches between backend and UI components
            access_condition: os.access_control_policy || os.access_condition || "",
            rejectionNote: os.refusal_handling || os.rejectionNote || "",
            transfer_company: os.transfer_in_group || os.transfer_company || "",
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
        }

        // Map Processor Section (Full mapping)
        const processorResponse = await fetch(
          `${API_BASE_URL}/owner/documents/${recordId}/processor-section`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!processorResponse.ok) {
          console.warn("Failed to fetch processor section", processorResponse.status);
        } else {
          const docProcessorData = await processorResponse.json();

          const ps =
            docProcessorData.processor_sections &&
            docProcessorData.processor_sections.length > 0
              ? docProcessorData.processor_sections[0]
              : docProcessorData;

          if (ps && Object.keys(ps).length > 0 && !ps.detail) {
            loadedAnySection = true;
            setProcessorForm((prev) => ({
              ...prev,
              ...ps, // Direct map all fields
              id: recordId,
              processor_name: ps.processor_name,
              controllerAddress: ps.controller_address || ps.controllerAddress,
              processing_activity: ps.processing_activity,
              purpose_of_processing: ps.purpose_of_processing || ps.purpose,
              status: (docProcessorData.status || ps.status) as RopaStatus,
              // Map field name mismatches between backend and UI components
              access_condition: ps.access_condition || "",
              transfer_company: ps.transfer_company || "",
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

        // Fetch existing DPO comments
        try {
          const commentsResponse = await fetch(
            `${API_BASE_URL}/dashboard/dpo/documents/${recordId}/comments`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (commentsResponse.ok) {
            loadedAnySection = true;
            const commentsData = await commentsResponse.json();
            const feedbacks: Record<string, string> = {};
            const openSections: string[] = [];
            const commentHistory: Record<
              string,
              { text: string; date?: string; reviewer?: string }[]
            > = {};

            commentsData.forEach((c: any) => {
              const thaiLabel =
                REVERSE_DO_KEY_MAP[c.section_key] ||
                REVERSE_DP_KEY_MAP[c.section_key];
              if (thaiLabel && c.comment) {
                feedbacks[thaiLabel] = c.comment;
                if (!openSections.includes(thaiLabel)) {
                  openSections.push(thaiLabel);
                }
                if (!commentHistory[thaiLabel]) {
                  commentHistory[thaiLabel] = [];
                }
                commentHistory[thaiLabel].push({
                  text: c.comment,
                  date: c.created_at,
                  reviewer:
                    c.reviewer_name ||
                    "เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล",
                });
              }
            });

            if (Object.keys(feedbacks).length > 0) {
              setSectionFeedbacks(feedbacks);
              setOpenFeedbackSections(openSections);
            }
            setSectionCommentHistory(commentHistory);
            setIsAwaitingResubmission(
              Object.keys(commentHistory).length > 0,
            );
          }
        } catch (err) {
          console.error("Failed to fetch comments:", err);
        }

        if (!loadedAnySection) {
          setError("ไม่สามารถโหลดข้อมูลฟอร์มได้ กรุณาลองใหม่อีกครั้ง");
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

  const tabs = ["owner", "processor", "risk", "destruction"];
  const hasPendingDestructionRequest =
    (form as any)?.deletion_status === "DELETE_PENDING" ||
    (form as any)?.deletion_request?.status === "PENDING";

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

  const handleSubmitDestructionReview = async () => {
    if (!recordId) return;
    if (!destructionDecision) {
      toast.error("กรุณาเลือกผลการตรวจสอบคำขอทำลาย");
      return;
    }
    if (destructionDecision === "REJECTED" && !destructionRejectReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการไม่อนุมัติ");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast.error("ไม่พบข้อมูลการเข้าสู่ระบบ");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/dashboard/dpo/destruction-requests/${recordId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: destructionDecision,
            rejection_reason:
              destructionDecision === "REJECTED"
                ? destructionRejectReason.trim()
                : null,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.text();
        if (res.status === 401) {
          throw new Error(
            "เซสชันหมดอายุหรือข้อมูลเข้าสู่ระบบไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
          );
        }
        throw new Error(err || "บันทึกผลการตรวจสอบคำขอทำลายไม่สำเร็จ");
      }
      toast.success("บันทึกผลการตรวจสอบคำขอทำลายเรียบร้อยแล้ว");
      router.push("/dpo/tables/in-progress");
    } catch (error: any) {
      console.error("Failed to review destruction request:", error);
      toast.error(error?.message || "เกิดข้อผิดพลาดในการบันทึกผลการตรวจสอบ");
    } finally {
      setIsSubmitting(false);
    }
  };


  const saveComments = async (isFinal: boolean) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error("ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่");
    }

    const doComments = Object.entries(sectionFeedbacks)
      .filter(([key, text]) => DO_KEY_MAP[key] && text.trim() !== "")
      .map(([key, text]) => ({
        section_id: DO_KEY_MAP[key],
        section_key: DO_KEY_MAP[key],
        comment: text,
      }));

    const dpComments = Object.entries(sectionFeedbacks)
      .filter(([key, text]) => DP_KEY_MAP[key] && text.trim() !== "")
      .map(([key, text]) => ({
        section_id: DP_KEY_MAP[key],
        section_key: DP_KEY_MAP[key],
        comment: text,
      }));

    const promises = [];

    const hasDoComments = doComments.length > 0;
    const hasDpComments = dpComments.length > 0;
    const hasAnyComments = hasDoComments || hasDpComments;
    
    let targetStatus = undefined;
    if (isFinal) {
      if (hasAnyComments) targetStatus = "REJECTED";
      else targetStatus = "APPROVED";
    }


    // Save DO group
    if (hasDoComments || (isFinal && !hasDpComments)) {
      const isThisFinal = isFinal && !hasDpComments;
      promises.push(() =>
        fetch(`${API_BASE_URL}/dashboard/dpo/documents/${recordId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            group: "DO",
            comments: doComments,
            is_final: isThisFinal,
            status: isThisFinal ? targetStatus : undefined,
          }),
        }),
      );
    }

    // Save DP group
    if (hasDpComments) {
      const isThisFinal = isFinal;
      promises.push(() =>
        fetch(`${API_BASE_URL}/dashboard/dpo/documents/${recordId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            group: "DP",
            comments: dpComments,
            is_final: isThisFinal,
            status: isThisFinal ? targetStatus : undefined,
          }),
        }),
      );
    }

    try {
      for (const request of promises) {
        const response = await request();
        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 401) {
            throw new Error(
              "เซสชันหมดอายุหรือข้อมูลเข้าสู่ระบบไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
            );
          }
          throw new Error(`บันทึกไม่สำเร็จ: ${errorText || response.statusText}`);
        }
      }
    } catch (err: any) {
      console.error("Save comments error:", err);
      throw err;
    }
  };

  const handleConfirmReview = async () => {
    if (activeTab === "destruction") {
      await handleSubmitDestructionReview();
      return;
    }
    if (isAwaitingResubmission) {
      toast.error("ส่งข้อเสนอแนะไปแล้ว กรุณารอผู้รับผิดชอบส่งกลับมาก่อน");
      return;
    }
    setIsSubmitting(true);
    try {
      await saveComments(true);
      setIsConfirmModalOpen(false);
      router.push("/dpo/tables/in-progress");
    } catch (err: any) {
      console.error("Submit review error:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastTab = activeTab === "risk";
  const isConfirmTab = activeTab === "risk" || activeTab === "destruction";
  const isDestructionTab = activeTab === "destruction";
  const isReviewLocked = !isDestructionTab && isAwaitingResubmission;
  const confirmButtonLabel = isDestructionTab
    ? "ยืนยันผลคำร้องขอทำลาย"
    : "ยืนยันผลการตรวจเอกสาร";
  const confirmModalTitle = isDestructionTab
    ? "ยืนยันผลคำร้องขอทำลาย"
    : "ยืนยันผลการตรวจเอกสาร";
  const confirmModalSubtitle = isDestructionTab
    ? "ยืนยันผลการพิจารณาคำร้องขอทำลายเอกสาร"
    : Object.keys(sectionFeedbacks).some((k) => sectionFeedbacks[k].trim() !== "")
      ? "คุณมีข้อเสนอแนะ ระบบจะส่งกลับไปให้ผู้รับผิดชอบแก้ไข"
      : "ยืนยันการตรวจสอบว่าถูกต้องครบถ้วนแล้ว";
  const confirmModalActionLabel = isSubmitting
    ? "กำลังดำเนินการ..."
    : isDestructionTab
      ? "ยืนยันผลคำร้อง"
      : "ยืนยันผลการตรวจ";
  const emptyHandler = () => {};
  const getLatestSuggestions = (
    sectionTitle: string,
    limit = 2,
  ): { text: string; date?: string; reviewer?: string }[] => {
    const history = sectionCommentHistory[sectionTitle] || [];
    return [...history]
      .sort((a, b) => {
        const aTime = new Date(a.date || 0).getTime();
        const bTime = new Date(b.date || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, limit)
      .reverse();
  };

  if (loading)
    return (
      <div className="flex-1 space-y-8 animate-in fade-in duration-500">
        {/* Tabs Skeleton */}
        <div className="h-14 bg-[#F6F6F6] rounded-xl animate-pulse flex p-2 gap-2">
           <div className="flex-1 bg-white/60 rounded-lg" />
           <div className="flex-1 bg-white/60 rounded-lg" />
           <div className="flex-1 bg-white/60 rounded-lg" />
        </div>

        {/* Form Sections Skeleton */}
        <div className="space-y-10 pb-32">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-gray-200 overflow-hidden">
                <div className="h-20 bg-gray-50/50 flex items-center px-8 gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="w-48 h-6 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <div className="px-8 pb-10 pt-4 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="w-32 h-4 bg-gray-100 rounded" />
                            <div className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            <div className="w-32 h-4 bg-gray-100 rounded" />
                            <div className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-[600px] flex items-center justify-center p-8">
        <ErrorState 
          isTable={false} 
          description={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );

  const renderOwnerSections = () => (
    <div className="space-y-12">
      {[
        { key: "ข้อมูลทั่วไป", title: "ส่วนที่ 1 : รายละเอียดของผู้ลงบันทึก RoPA", component: GeneralInfo, icon: "person_edit" },
        { key: "ช่องทางใช้สิทธิ", title: "ส่วนที่ 2 : ช่องทางการติดต่อกรณีต้องการใช้สิทธิ", component: RightsChannel, icon: "how_to_reg" },
        { key: "กิจกรรมประมวลผล", title: "ส่วนที่ 3 : รายละเอียดของกิจกรรมและวัตถุประสงค์", component: LocalActivityDetails, icon: "accessibility_new" },
        { key: "ข้อมูลที่จัดเก็บ", title: "ส่วนที่ 4 : ข้อมูลส่วนบุคคลที่จัดเก็บ", component: StoredInfo, icon: "database" },
        { key: "ระยะเวลาการเก็บรักษา", title: "ส่วนที่ 5 : การเก็บรักษาข้อมูล", component: RetentionInfo, icon: "timer" },
        { key: "ฐานทางกฎหมาย", title: "ส่วนที่ 6 : ฐานทางกฎหมาย (Legal Basis)", component: LegalInfo, icon: "gavel" },
        { key: "มาตรการรักษาความปลอดภัย", title: "ส่วนที่ 7 : มาตรการการรักษาความมั่นคงปลอดภัย", component: SecurityMeasures, icon: "shield_lock" },
      ].map((sec, idx) => (
        <SectionCommentBox
          key={idx}
          title={sec.title}
          icon={sec.icon}
          isOpen={openFeedbackSections.includes(sec.key)}
          onToggle={() => toggleFeedback(sec.key)}
          value={sectionFeedbacks[sec.key] || ""}
          onChange={(text) =>
            setSectionFeedbacks((prev) => ({ ...prev, [sec.key]: text }))
          }
          suggestions={getLatestSuggestions(sec.key, 2)}
          readOnly={isAwaitingResubmission}
          variant="do"
        >
          <sec.component
            form={form}
            handleChange={emptyHandler}
            errors={{}}
            disabled={true}
            hideHeader={true}
          />
        </SectionCommentBox>
      ))}
    </div>
  );

  const renderProcessorSections = () => (
    <div className="space-y-12">
      {[
        { key: "ข้อมูลทั่วไป (DP)", title: "ส่วนที่ 1 : รายละเอียดของผู้ลงบันทึก RoPA", component: GeneralInfo, icon: "corporate_fare" },
        { key: "กิจกรรมประมวลผล (DP)", title: "ส่วนที่ 2 : รายละเอียดกิจกรรม", component: LocalActivityDetails, icon: "settings_accessibility" },
        { key: "ข้อมูลที่จัดเก็บ (DP)", title: "ส่วนที่ 3 : ข้อมูลส่วนบุคคลที่จัดเก็บ", component: StoredInfo, icon: "inventory_2" },
        { key: "ระยะเวลาการเก็บรักษา (DP)", title: "ส่วนที่ 4 : การเก็บรักษาข้อมูล", component: RetentionInfo, icon: "history" },
        { key: "ฐานทางกฎหมาย (DP)", title: "ส่วนที่ 5 : ฐานทางกฎหมาย (Legal Basis)", component: LegalInfo, icon: "balance" },
        { key: "มาตรการรักษาความปลอดภัย (DP)", title: "ส่วนที่ 6 : มาตรการการรักษาความมั่นคงปลอดภัย", component: SecurityMeasures, icon: "lock" },
      ].map((sec, idx) => (
        <SectionCommentBox
          key={idx}
          title={sec.title}
          icon={sec.icon}
          isOpen={openFeedbackSections.includes(sec.key)}
          onToggle={() => toggleFeedback(sec.key)}
          value={sectionFeedbacks[sec.key] || ""}
          onChange={(text) =>
            setSectionFeedbacks((prev) => ({ ...prev, [sec.key]: text }))
          }
          suggestions={getLatestSuggestions(sec.key, 2)}
          readOnly={isAwaitingResubmission}
          variant="dp"
        >
          <sec.component
            form={processorForm}
            handleChange={emptyHandler}
            errors={{}}
            disabled={true}
            hideHeader={true}
            variant="processor"
          />
        </SectionCommentBox>
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
            <div className="flex justify-end">
              <ActionIconWithTooltip
                icon={
                  openFeedbackSections.includes("การประเมินความเสี่ยง")
                    ? "close"
                    : "comment"
                }
                tooltipText={
                  openFeedbackSections.includes("การประเมินความเสี่ยง")
                    ? "ปิดข้อเสนอแนะ"
                    : "เพิ่มข้อเสนอแนะ"
                }
                buttonClassName={cn(
                  "rounded-full",
                  openFeedbackSections.includes("การประเมินความเสี่ยง")
                    ? "bg-[#ED393C] text-white hover:bg-[#ED393C]"
                    : "bg-[#F6F3F2] text-[#5C403D] hover:bg-[#E5E2E1]",
                  isAwaitingResubmission && "opacity-50 cursor-not-allowed",
                )}
                disabled={isAwaitingResubmission}
                onClick={() => {
                  if (isAwaitingResubmission) return;
                  const wasOpen = openFeedbackSections.includes(
                    "การประเมินความเสี่ยง",
                  );
                  toggleFeedback("การประเมินความเสี่ยง");
                  if (!wasOpen) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              />
            </div>
            {openFeedbackSections.includes("การประเมินความเสี่ยง") && (
              <div className="bg-white rounded-[20px] shadow-sm border-l-[6px] border-l-[#ED393C] p-6 animate-in slide-in-from-top-4 duration-300">
                <div className="bg-[#F6F3F2]/60 rounded-xl p-4">
                  <textarea
                    className="w-full bg-transparent border-none outline-none text-[#5C403D] font-medium placeholder:text-[#5C403D]/40 resize-none min-h-[40px]"
                    placeholder="ระบุข้อเสนอแนะสำหรับการประเมินความเสี่ยง"
                    value={sectionFeedbacks["การประเมินความเสี่ยง"] || ""}
                    disabled={isAwaitingResubmission}
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
              showFeedback={false}
              isFeedbackOpen={openFeedbackSections.includes(
                "การประเมินความเสี่ยง",
              )}
              onToggleFeedback={() => toggleFeedback("การประเมินความเสี่ยง")}
              feedbackData={(form as any).suggestions?.filter((s: any) => s.section === "DO_RISK" || s.section_id === "DO_RISK" || s.section_id === "risk").map((s: any) => ({
                content: s.comment,
                created_at: s.date
              })) || []}
            />

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

        {activeTab === "destruction" && (
          <div className="mt-4 pb-32 space-y-8">
            {!hasPendingDestructionRequest ? (
              <div className="flex flex-col items-center justify-center py-40 text-center text-[#5F5E5E]">
                <p className="text-[22px] leading-relaxed max-w-[600px]">
                  "ยังไม่มีคำร้องขอทำลาย"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-[30px] font-black text-[#1B1C1C] leading-tight">
                  เหตุผลในการขอทำลายเอกสาร
                </h3>
                <div className="bg-[#F3F3F3] border border-[#E5E2E1] rounded-xl px-6 py-4 text-[#5F5E5E] font-medium min-h-[56px]">
                  {(form as any)?.deletion_request?.reason ||
                    (form as any)?.deletion_request?.request_reason ||
                    (form as any)?.deletion_reason ||
                    "-"}
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setDestructionDecision("APPROVED")}
                    className={cn(
                      "h-12 px-6 rounded-xl border font-bold text-[16px] flex items-center gap-3",
                      destructionDecision === "APPROVED"
                        ? "border-[#ED393C] bg-[#FFF5F5] text-[#1B1C1C]"
                        : "border-[#E5E2E1] bg-white text-[#1B1C1C]",
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full border-2 inline-block",
                        destructionDecision === "APPROVED"
                          ? "border-[#ED393C] bg-[#ED393C]"
                          : "border-[#B8B8B8]",
                      )}
                    />
                    อนุมัติคำร้อง
                  </button>

                  <button
                    type="button"
                    onClick={() => setDestructionDecision("REJECTED")}
                    className={cn(
                      "h-12 px-6 rounded-xl border font-bold text-[16px] flex items-center gap-3",
                      destructionDecision === "REJECTED"
                        ? "border-[#ED393C] bg-[#FFF5F5] text-[#1B1C1C]"
                        : "border-[#E5E2E1] bg-white text-[#1B1C1C]",
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full border-2 inline-block",
                        destructionDecision === "REJECTED"
                          ? "border-[#ED393C] bg-[#ED393C]"
                          : "border-[#B8B8B8]",
                      )}
                    />
                    ไม่อนุมัติคำร้อง
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[30px] font-black text-[#1B1C1C] leading-tight">
                    เหตุผลในการไม่อนุมัติ
                  </label>
                  <textarea
                    value={destructionRejectReason}
                    onChange={(e) => setDestructionRejectReason(e.target.value)}
                    placeholder="ระบุเหตุผลในการไม่อนุมัติ"
                    className="w-full min-h-[64px] bg-[#F3F3F3] border border-[#E5E2E1] rounded-xl px-5 py-4 text-[#1B1C1C] placeholder:text-[#A0A0A0] outline-none"
                  />
                </div>
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
          {activeTab !== "destruction" && (
          <button
            onClick={handlePrevTab}
            className="px-10 h-[52px] rounded-2xl font-bold text-[#5C403D] border border-[#E5E2E1] hover:bg-gray-50 transition-all cursor-pointer shadow-md"
          >
            ย้อนกลับ
          </button>
          )}

          {isConfirmTab ? (
            <button
              onClick={() => {
                if (activeTab === "destruction" && !hasPendingDestructionRequest) return;
                if (isReviewLocked) return;
                setIsConfirmModalOpen(true);
              }}
              disabled={
                (activeTab === "destruction" && !hasPendingDestructionRequest) ||
                isReviewLocked
              }
              className={cn(
                "bg-logout-gradient leading-none text-white px-10 h-[52px] rounded-2xl font-black text-base shadow-2xl shadow-red-900/40 transition-all flex items-center gap-2",
                (activeTab === "destruction" && !hasPendingDestructionRequest) ||
                  isReviewLocked
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:brightness-110 active:scale-95 cursor-pointer",
              )}
            >
              {confirmButtonLabel}
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
        title={confirmModalTitle}
        subtitle={confirmModalSubtitle}
        buttonText={confirmModalActionLabel}
      />
    </div>
  );
}

export default function DPOInProgressDetailPage() {
  return (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-[#ED393C]/10 border-t-[#ED393C] rounded-full animate-spin"></div>
            <p className="text-[15px] font-bold text-[#5F5E5E] animate-pulse">กำลังโหลดหน้าเอกสาร...</p>
        </div>
    }>
      <DpoInProgressDetailContent />
    </Suspense>
  );
}
