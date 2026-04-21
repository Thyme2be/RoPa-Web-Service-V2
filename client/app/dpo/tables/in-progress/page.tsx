"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ListCard,
  Pagination,
  GenericFilterBar,
  StatusBadge,
} from "@/components/ropa/RopaListComponents";
import Select from "@/components/ui/Select";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import SendToAuditorModal from "@/components/ui/SendToAuditorModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function InProgressTableContent() {
  const searchParams = useSearchParams();
  const globalSearchQuery = searchParams.get("search") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
  const [selectedDateRange, setSelectedDateRange] = useState("ทั้งหมด");
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 3;

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found");
      setLoading(false);
      return;
    }

    try {
      const daysFilter =
        selectedDateRange === "ภายใน 7 วัน"
          ? 7
          : selectedDateRange === "ภายใน 30 วัน"
            ? 30
            : 0;

      let statusFilter = "";
      if (selectedStatus === "รอตรวจสอบ") statusFilter = "IN_REVIEW";
      else if (selectedStatus === "รอส่วนของ Data Owner")
        statusFilter = "ACTION_REQUIRED_DO";
      else if (selectedStatus === "รอส่วนของ Data processor")
        statusFilter = "ACTION_REQUIRED_DP";
      else if (selectedStatus === "ตรวจสอบเสร็จสิ้น")
        statusFilter = "DPO_APPROVED";

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        days_filter: daysFilter.toString(),
      });

      if (statusFilter) queryParams.append("status", statusFilter);
      if (globalSearchQuery) queryParams.append("search", globalSearchQuery);

      const response = await fetch(
        `${API_BASE_URL}/dashboard/dpo/documents?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(data.items || []);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      console.error("Fetch docs error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [currentPage, selectedStatus, selectedDateRange, globalSearchQuery]);

  const formatThaiDate = (dateStr: string | null) => {
    if (!dateStr || dateStr === "-") return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getUIStatus = (apiStatus: string) => {
    switch (apiStatus) {
      case "IN_REVIEW":
        return "รอตรวจสอบ";
      case "ACTION_REQUIRED_DO":
        return "ต้องแก้ไข"; // Simplified for StatusBadge
      case "ACTION_REQUIRED_DP":
        return "ต้องแก้ไข";
      case "DPO_APPROVED":
        return "ตรวจสอบเสร็จสิ้น";
      default:
        return "ฉบับร่าง";
    }
  };

  const getDisplayStatus = (apiStatus: string) => {
    switch (apiStatus) {
      case "IN_REVIEW":
        return "รอตรวจสอบ";
      case "ACTION_REQUIRED_DO":
        return "รอส่วนของ Data Owner";
      case "ACTION_REQUIRED_DP":
        return "รอส่วนของ Data processor";
      case "DPO_APPROVED":
        return "ตรวจสอบเสร็จสิ้น";
      default:
        return "ฉบับร่าง";
    }
  };

  const getStatusType = (apiStatus: string) => {
    switch (apiStatus) {
      case "IN_REVIEW":
        return "waiting";
      case "ACTION_REQUIRED_DO":
        return "edit";
      case "ACTION_REQUIRED_DP":
        return "edit";
      case "DPO_APPROVED":
        return "success";
      default:
        return "draft";
    }
  };

  const getPairedBadgeColor = (status: string) => {
    if (status === "done") return "bg-[#228B15] text-white";
    if (status === "edit") return "bg-[#ED393C] text-white";
    return "bg-gray-200 text-gray-700";
  };

  const tooltipContent = (
    <div className="bg-white text-[#5C403D] p-5 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.2)] text-left border border-[#E5E2E1]/60 w-max max-w-[450px]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-[#F1EDEC] pb-2">
          <span className="text-[15px] font-bold tracking-tight text-[#5C403D]">
            คำอธิบายสถานะ
          </span>
          <span className="material-symbols-outlined text-[14px] opacity-70">
            info
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-4 text-[14px] whitespace-nowrap">
            <span className="font-bold w-[100px] shrink-0">Data Owner</span>
            <span className="font-medium opacity-80 leading-relaxed">
              หมายถึง ผู้รับผิดชอบข้อมูล
            </span>
          </div>
          <div className="flex items-baseline gap-4 text-[14px] whitespace-nowrap">
            <span className="font-bold w-[100px] shrink-0">Data Processor</span>
            <span className="font-medium opacity-80 leading-relaxed">
              หมายถึง ผู้ประมวลผลข้อมูลส่วนบุคคล
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  const handleAssignAuditor = async (data: any) => {
    if (!selectedDocId) return;
    setIsSubmittingAssignment(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/${selectedDocId}/assign-auditor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: data.prefix,
            first_name: data.firstName,
            last_name: data.lastName,
            auditor_type: data.auditorType.toUpperCase(),
            department: data.department,
            due_date: data.dueDate
              ? new Date(data.dueDate).toISOString()
              : new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to assign auditor");
      }

      alert("ส่งเอกสารให้ผู้ตรวจสอบเรียบร้อยแล้ว");
      setIsSendModalOpen(false);
      fetchDocuments(); // Refresh list
    } catch (err: any) {
      console.error("Assign auditor error:", err);
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  return (
    <div className="flex flex-col h-full -m-8">
      <div className="flex-1 p-8 space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-[28px] font-headline font-black text-[#1B1C1C] tracking-tight mb-1">
            ตารางแสดงเอกสารที่ดำเนินการ
          </h2>
        </div>

        {/* Filters Box */}
        <GenericFilterBar
          onClear={() => {
            setSelectedStatus("ทั้งหมด");
            setSelectedDateRange("ทั้งหมด");
            setCurrentPage(1);
          }}
        >
          <div className="w-[280px]">
            <Select
              label="สถานะ"
              name="status"
              rounding="xl"
              bgColor="white"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { label: "ทั้งหมด", value: "ทั้งหมด" },
                { label: "รอตรวจสอบ", value: "รอตรวจสอบ" },
                {
                  label: "รอส่วนของ Data Owner",
                  value: "รอส่วนของ Data Owner",
                },
                {
                  label: "รอส่วนของ Data processor",
                  value: "รอส่วนของ Data processor",
                },
                { label: "ตรวจสอบเสร็จสิ้น", value: "ตรวจสอบเสร็จสิ้น" },
              ]}
              containerClassName="!w-full"
            />
          </div>
          <div className="flex gap-6 items-end">
            <div className="w-[280px]">
              <Select
                label="ช่วงวันที่"
                name="dateRange"
                rounding="xl"
                bgColor="white"
                value={selectedDateRange}
                onChange={(e) => {
                  setSelectedDateRange(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { label: "ทั้งหมด", value: "ทั้งหมด" },
                  { label: "ภายใน 7 วัน", value: "ภายใน 7 วัน" },
                  { label: "ภายใน 30 วัน", value: "ภายใน 30 วัน" },
                ]}
                containerClassName="!w-full"
              />
            </div>
          </div>
        </GenericFilterBar>

        {/* Table Section */}
        <div className="relative z-10">
          <ListCard
            title="เอกสารที่ดำเนินการ"
            icon="check_circle"
            iconColor="#00818B"
          >
            <div className="overflow-visible">
              <table className="w-full text-center border-collapse">
                <thead className="relative z-20">
                  <tr className="border-b border-[#E5E2E1]/40">
                    <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-left pl-4">
                      ชื่อเอกสาร
                    </th>
                    <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-center">
                      ชื่อผู้รับผิดชอบข้อมูล
                    </th>
                    <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-center">
                      วันที่ได้รับ
                    </th>
                    <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-center">
                      วันที่ตรวจสอบ
                    </th>
                    <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase overflow-visible text-center">
                      <div className="flex items-center justify-center gap-1 overflow-visible">
                        <span>สถานะ</span>
                        <CustomTooltip content={tooltipContent}>
                          <span className="text-[#5C403D] opacity-70 material-symbols-outlined text-xs cursor-help">
                            info
                          </span>
                        </CustomTooltip>
                      </div>
                    </th>
                    <th className="py-3 text-[14px] font-black tracking-tight text-[#5C403D] uppercase text-center">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2E1]/10">
                  {loading ? (
                    <tr key={"loading"}>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-[#5F5E5E] font-medium italic animate-pulse"
                      >
                        กำลังโหลดข้อมูล...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr key={"error"}>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-[#ED393C] font-black"
                      >
                        {error}
                      </td>
                    </tr>
                  ) : documents.length > 0 ? (
                    documents.map((doc) => (
                      <tr
                        key={doc.raw_document_id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="py-4 text-[13.5px] font-medium text-left pl-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[#5F5E5E] text-[13.5px] font-medium">
                              {doc.document_id}
                            </span>
                            <span className="text-[#5F5E5E] font-medium tracking-tight">
                              {doc.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-[13.5px] font-medium text-[#5C403D] text-center">
                          {doc.data_owner_name}
                        </td>
                        <td className="py-4 text-[13.5px] font-medium text-[#5C403D] text-center">
                          {formatThaiDate(doc.assigned_at)}
                        </td>
                        <td className="py-4 text-[13.5px] font-medium text-[#5C403D] text-center">
                          {formatThaiDate(doc.dpo_reviewed_date)}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1 items-center justify-center py-1">
                            {doc.review_status === "IN_REVIEW" ||
                            doc.review_status === "DPO_APPROVED" ? (
                              <StatusBadge
                                status={getUIStatus(doc.review_status) as any}
                              />
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black inline-block text-center min-w-[180px] ${getPairedBadgeColor(doc.owner_status)} shadow-sm`}
                                >
                                  Data Owner:{" "}
                                  {doc.owner_status === "done"
                                    ? "เสร็จสิ้น"
                                    : "ต้องแก้ไข"}
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black inline-block text-center min-w-[180px] ${getPairedBadgeColor(doc.processor_status)} shadow-sm`}
                                >
                                  Data Processor:{" "}
                                  {doc.processor_status === "done"
                                    ? "เสร็จสิ้น"
                                    : "ต้องแก้ไข"}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex justify-center gap-3">
                            <Link
                              href={`/dpo/tables/in-progress/${doc.raw_document_id}`}
                              title="ดูรายละเอียดและส่งข้อเสนอแนะ"
                              className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer"
                            >
                              <span
                                className="material-symbols-outlined text-[20px]"
                                style={{ fontVariationSettings: "'FILL' 0" }}
                              >
                                comment
                              </span>
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedDocId(doc.raw_document_id);
                                setIsSendModalOpen(true);
                              }}
                              title="ส่งให้ผู้ตรวจสอบ"
                              className="w-9 h-9 rounded-full bg-[#F6F3F2] flex items-center justify-center text-[#5C403D] hover:bg-[#E5E2E1]/60 transition-colors cursor-pointer"
                            >
                              <span
                                className="material-symbols-outlined text-[20px]"
                                style={{ fontVariationSettings: "'FILL' 0" }}
                              >
                                send
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-[#5F5E5E] opacity-60 font-medium"
                      >
                        ไม่พบข้อมูลที่ค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Area */}
              {!loading && !error && documents.length > 0 && (
                <div className="px-0 py-4 bg-[#F6F3F2]/30 rounded-b-xl border-t border-[#E5E2E1]/40 -mx-6 -mb-6">
                  <div className="px-6 flex items-center justify-between">
                    <p className="text-[12px] font-medium text-[#5F5E5E] opacity-80">
                      แสดง {startIndex + 1} ถึง{" "}
                      {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}{" "}
                      จากทั้งหมด {totalItems} รายการ
                    </p>
                    <div className="[&_p]:hidden [&_div]:mt-0">
                      <Pagination
                        current={currentPage}
                        total={totalPages}
                        onChange={setCurrentPage}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ListCard>
        </div>
      </div>

      {/* Send to Auditor Modal */}
      <SendToAuditorModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onConfirm={handleAssignAuditor}
        isLoading={isSubmittingAssignment}
      />
    </div>
  );
}

export default function InProgressPage() {
  return (
    <Suspense fallback={<div className="p-8">กำลังโหลด...</div>}>
      <InProgressTableContent />
    </Suspense>
  );
}
