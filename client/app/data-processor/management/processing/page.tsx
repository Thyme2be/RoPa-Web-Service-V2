"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import {
  DocumentListCard,
  DocumentFilterBar,
  DocumentPagination,
  DocumentTable,
  DocumentTableHead,
  DocumentTableHeader,
  DocumentTableHeaderWithTooltip,
  DocumentTableBody,
  DocumentTableRow,
  DocumentTableCell,
  ActionIconWithTooltip,
} from "@/components/ropa/ListComponents";
import { StatusBadge } from "@/components/ropa/RopaListComponents";
import { useRouter } from "next/navigation";
import { useProcessor } from "@/context/ProcessorContext";
import { RopaStatus, SectionStatus } from "@/types/enums";
import { OwnerRecord } from "@/types/dataOwner";
import { cn } from "@/lib/utils";
import SendToOwnerModal from "@/components/ui/SendToOwnerModal";
import toast from "react-hot-toast";

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText,
  onConfirm,
  onCancel,
  isLoading = false,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#1C1B1F]/40 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <h2 className="text-[22px] font-black text-[#1B1C1C] mb-3">{title}</h2>
        <p className="text-sm font-bold text-[#5F5E5E] mb-8">{description}</p>
        <div className="flex gap-4 w-full">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl border border-[#E5E2E1] font-bold text-[#5C403D] hover:bg-[#F6F3F2] transition-all disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl bg-[#B51E22] text-white font-black shadow-lg shadow-[#B51E22]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import TableLoading from "@/components/ui/TableLoading";

export default function ManagementProcessingPage() {
  const router = useRouter();
  const {
    processorAssignedRecords,
    processorAssignedMeta,
    fetchProcessorAssignedTable,
    processorSnapshots,
    deleteProcessorRecord,
    dispatchDpSection,
    isLoading,
    error,
    clearError,
    refresh,
  } = useProcessor();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [draftPage, setDraftPage] = useState(1);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchProcessorAssignedTable(page, 3, debouncedSearch);
  }, [page, debouncedSearch, fetchProcessorAssignedTable]);

  const [submitConfirm, setSubmitConfirm] = useState<{
    open: boolean;
    id: string;
  }>({ open: false, id: "" });
  const [deleteDraftConfirm, setDeleteDraftConfirm] = useState<{
    open: boolean;
    id: string;
  }>({ open: false, id: "" });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitToDO = async (id: string) => {
    setIsSubmitting(true);
    try {
      await dispatchDpSection(id);
      setSubmitConfirm({ open: false, id: "" });
    } catch (error) {
      console.error("Failed to submit to DO:", error);
      toast.error("เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");

  const handleClearFilters = () => {
    setStatusFilter("all");
    setDateFilter("all");
    setCustomDate("");
    setPage(1);
  };

  const assignedRecords = processorAssignedRecords;
  const draftRecords = processorSnapshots;

  const filteredDrafts = draftRecords.filter((record) => {
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        (record.document_number?.toLowerCase() || "").includes(searchLower) ||
        (record.title?.toLowerCase() || "").includes(searchLower)
      );
    }
    return true;
  });

  const filteredAssigned = assignedRecords
    .filter((record) => {
      // Status Filter
      if (
        statusFilter !== "all" &&
        record.status?.code !== statusFilter
      ) {
        return false;
      }

      // Date Filter (Due Date)
      if (dateFilter !== "all" && record.due_date) {
        const dueDate = new Date(record.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (dateFilter === "7days") {
          if (diffDays > 7) return false;
        } else if (dateFilter === "30days") {
          if (diffDays > 30) return false;
        } else if (dateFilter === "overdue") {
          if (dueDate >= today) return false;
        } else if (dateFilter === "custom" && customDate) {
          const cDate = new Date(customDate);
          cDate.setHours(0, 0, 0, 0);
          const dDate = new Date(record.due_date);
          dDate.setHours(0, 0, 0, 0);
          if (cDate.getTime() !== dDate.getTime()) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // 1. Status Priority
      const statusPriority: Record<string, number> = {
        DP_NEED_FIX: 1,
        WAITING_DP: 2,
        WAITING_CHECK: 3,
        CHECK_DONE: 4,
      };
      const pA = statusPriority[a.status?.code || ""] || 99;
      const pB = statusPriority[b.status?.code || ""] || 99;
      if (pA !== pB) return pA - pB;

      // 3. Due Date Urgency (Ascending - soonest first)
      const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;

      // 4. Recency (Descending - newest assignment first)
      const recA = a.received_at ? new Date(a.received_at).getTime() : 0;
      const recB = b.received_at ? new Date(b.received_at).getTime() : 0;
      return recB - recA;
    });

  const PROCESSING_ITEMS_PER_PAGE = 3;
  const DRAFT_ITEMS_PER_PAGE = 2;

  const isProcessingFilterActive =
    statusFilter !== "all" ||
    dateFilter !== "all";

  // Use filtered records when filters are active so dropdown works as expected
  const paginatedProcessing = isProcessingFilterActive ? filteredAssigned : assignedRecords;

  // Drafts still use client slicing for now as they are usually fewer
  const paginatedDrafts = filteredDrafts.slice(
    (draftPage - 1) * DRAFT_ITEMS_PER_PAGE,
    draftPage * DRAFT_ITEMS_PER_PAGE,
  );

  const statusOptions = [
    { label: "ทั้งหมด", value: "all" },
    { label: "รอส่วนของ Data Processor", value: "WAITING_DP" },
    { label: "รอตรวจสอบ", value: "WAITING_CHECK" },
    { label: "รอส่วนของ Data Processor แก้ไข", value: "DP_NEED_FIX" },
    { label: "ตรวจสอบเสร็จสิ้น", value: "CHECK_DONE" },
  ];

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F6F3F2]">
        <Sidebar />
        <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex items-center justify-center p-10">
          <ErrorState
            title="ไม่สามารถโหลดข้อมูลงานที่มอบหมายได้"
            description={error}
            onRetry={() => { clearError(); refresh(); }}
            isTable={false}
          />
        </main>
      </div>
    );
  }

  const isInitialLoading = isLoading && !processorAssignedRecords.length && !processorSnapshots.length;

  if (isInitialLoading) {
    return <LoadingState fullPage message="กำลังโหลด..." />;
  }

  return (
    <div className="flex min-h-screen bg-[#F6F3F2] relative">
      <Sidebar />

      <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col">
        <TopBar
          showBack={false}
          backUrl="/data-processor/management"
          pageTitle=" "
          hideSearch={false}
          searchQuery={searchQuery}
          onSearchChange={(e: any) => setSearchQuery(e.target.value)}
          isProcessor={true}
        />

        <div className="p-10 space-y-10">
          <div className="flex justify-between items-center">
            <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
              ตารางแสดงเอกสารที่ได้รับมอบหมายจากผู้รับผิดชอบข้อมูล
            </h1>
          </div>

          <DocumentFilterBar
            statusOptions={statusOptions}
            statusValue={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            dateValue={dateFilter}
            onDateChange={(value) => {
              setDateFilter(value);
              setPage(1);
            }}
            customDate={customDate}
            onCustomDateChange={(value) => {
              setCustomDate(value);
              setPage(1);
            }}
            onClear={handleClearFilters}
          />

          <DocumentListCard
            title="เอกสารที่ได้รับมอบหมาย"
            icon="assignment"
            iconColor="#00666E"
            bodyClassName="p-0"
          >
            <DocumentTable>
              <DocumentTableHead>
                <DocumentTableHeader
                  width="w-[25%]"
                  align="center"
                >
                  ชื่อเอกสาร
                </DocumentTableHeader>
                <DocumentTableHeader width="w-[20%]" align="center">
                  ชื่อผู้รับผิดชอบข้อมูล
                </DocumentTableHeader>
                <DocumentTableHeader width="w-[12%]" align="center">
                  วันที่ได้รับ
                </DocumentTableHeader>
                <DocumentTableHeader width="w-[13%]" align="center">
                  วันที่กำหนดส่ง
                </DocumentTableHeader>
                <DocumentTableHeaderWithTooltip
                  width="w-[18%]"
                  title="สถานะ"
                  tooltipText={
                    <div className="space-y-1">
                      <p>
                        <span className="w-28 inline-block font-bold text-[#1B1C1C]">
                          Data Owner
                        </span>{" "}
                        หมายถึง ผู้รับผิดชอบข้อมูล
                      </p>
                      <p>
                        <span className="w-28 inline-block font-bold text-[#1B1C1C]">
                          Data Processor
                        </span>{" "}
                        หมายถึง ผู้ประมวลผลข้อมูลส่วนบุคคล
                      </p>
                    </div>
                  }
                />
                <DocumentTableHeader width="w-[12%]" align="center">
                  การดำเนินการ
                </DocumentTableHeader>
              </DocumentTableHead>
              <DocumentTableBody>
                {isLoading ? (
                  <TableLoading colSpan={6} />
                ) : paginatedProcessing.length === 0 ? (
                  <DocumentTableRow>
                    <DocumentTableCell colSpan={6} align="center">
                      <span className="text-[#9CA3AF] font-bold py-10 block">
                        ไม่พบเอกสารที่มอบหมาย
                      </span>
                    </DocumentTableCell>
                  </DocumentTableRow>
                ) : (
                  paginatedProcessing.map((record) => (
                    <DocumentTableRow key={record.id}>
                      <DocumentTableCell align="left" className="pl-6 font-medium">
                        <div className="text-[#5F5E5E]">
                          {record.document_number} {record.title}
                        </div>
                      </DocumentTableCell>
                      <DocumentTableCell align="center" className="text-[#5C403D] font-medium">
                        {record.do_name || "—"}
                      </DocumentTableCell>
                      <DocumentTableCell align="center" className="text-[#5C403D] font-medium">
                        {record.received_at
                          ? new Date(record.received_at).toLocaleDateString("th-TH")
                          : "—"}
                      </DocumentTableCell>
                      <DocumentTableCell align="center" className="text-[#5C403D] font-medium">
                        {record.due_date
                          ? new Date(record.due_date).toLocaleDateString(
                            "th-TH",
                          )
                          : "—"}
                      </DocumentTableCell>
                      <DocumentTableCell>
                        <div className="flex flex-col items-center gap-1 py-1">
                          {(() => {
                            const hasSubmittedSection =
                              record.processor_section_status === "SUBMITTED";
                            const hasNeedFixFromDo =
                              (record.status?.code === "DP_NEED_FIX" ||
                                record.status?.code === "DPO_REJECTED") &&
                              !hasSubmittedSection;

                            return (
                          <StatusBadge
                            status={
                              record.status?.code === "WAITING_DO"
                                ? "รอส่วนของ Data Owner"
                                : hasNeedFixFromDo
                                  ? "รอส่วนของ Data Processor แก้ไข"
                                  : record.status?.code === "WAITING_DP"
                                  ? "รอส่วนของ Data Processor"
                                  : record.status?.code === "CHECK_DONE"
                                    ? "Data Processor ดำเนินการเสร็จสิ้น"
                                    : "Data Processor ดำเนินการเสร็จสิ้น"
                            }
                          />
                            );
                          })()}
                        </div>
                      </DocumentTableCell>
                      <DocumentTableCell>
                        <div className="flex items-center justify-center gap-3">
                          <ActionIconWithTooltip
                            icon="visibility"
                            tooltipText="ดูเอกสาร"
                            buttonClassName="text-[#5F5E5E] hover:text-[#00666E]"
                            onClick={() =>
                              router.push(
                                `/data-processor/management/form?id=${record.id}&mode=view`,
                              )
                            }
                          />
                          <div className={cn(
                            "p-2",
                            record.is_sent &&
                              record.processor_section_status === "SUBMITTED" &&
                              "text-[#107C41]",
                          )}>
                            {(() => {
                              const hasSubmittedSection =
                                record.processor_section_status === "SUBMITTED";
                              const hasNeedFixFromDo =
                                (record.status?.code === "DP_NEED_FIX" ||
                                  record.status?.code === "DPO_REJECTED") &&
                                !hasSubmittedSection;
                              const isActuallySent = record.is_sent && hasSubmittedSection;
                              const isDisabled =
                                isActuallySent ||
                                record.status?.code === "CHECK_DONE" ||
                                !hasSubmittedSection ||
                                hasNeedFixFromDo;
                              const tooltipText = isActuallySent
                                ? "ส่งให้ผู้รับผิดชอบข้อมูลตรวจสอบแล้ว"
                                : record.status?.code === "CHECK_DONE"
                                  ? "ดำเนินการตรวจสอบเสร็จสิ้นแล้ว"
                                  : !hasSubmittedSection
                                    ? "ท่านต้องกรอกข้อมูลให้เสร็จสิ้นก่อนส่ง"
                                    : hasNeedFixFromDo
                                      ? "กรุณาแก้ไขและบันทึกในฟอร์มก่อนจึงจะส่งได้"
                                    : "ส่งข้อมูลให้ผู้รับผิดชอบข้อมูลตรวจสอบ";

                              return (
                            <ActionIconWithTooltip
                              icon="send"
                              disabled={isDisabled}
                              tooltipText={tooltipText}
                              buttonClassName={cn(
                                isDisabled
                                  ? "text-[#9CA3AF]"
                                  : "text-[#5F5E5E] hover:text-[#00666E]"
                              )}
                              onClick={() =>
                                setSubmitConfirm({ open: true, id: record.id })
                              }
                            />
                              );
                            })()}
                          </div>
                        </div>
                      </DocumentTableCell>
                    </DocumentTableRow>
                  ))
                )}
              </DocumentTableBody>
            </DocumentTable>
            <DocumentPagination
              current={page}
              totalPages={isProcessingFilterActive ? 1 : processorAssignedMeta.total_pages}
              totalItems={isProcessingFilterActive ? filteredAssigned.length : processorAssignedMeta.total}
              itemsPerPage={PROCESSING_ITEMS_PER_PAGE}
              onChange={setPage}
            />
          </DocumentListCard>

          <DocumentListCard
            title="ฉบับร่าง"
            icon="edit_note"
            iconColor="#5C403D"
            bodyClassName="p-0"
          >
            <DocumentTable>
              <DocumentTableHead>
                <DocumentTableHeader width="w-[50%]" align="center">
                  ชื่อเอกสาร
                </DocumentTableHeader>
                <DocumentTableHeader width="w-[25%]" align="center">
                  บันทึกล่าสุดเมื่อ
                </DocumentTableHeader>
                <DocumentTableHeader width="w-[25%]" align="center">
                  การดำเนินการ
                </DocumentTableHeader>
              </DocumentTableHead>
              <DocumentTableBody>
                {isLoading ? (
                  <TableLoading colSpan={3} />
                ) : paginatedDrafts.length === 0 ? (
                  <DocumentTableRow>
                    <DocumentTableCell colSpan={3} align="center">
                      <span className="text-[#9CA3AF] font-bold py-10 block">
                        ไม่มีฉบับร่าง
                      </span>
                    </DocumentTableCell>
                  </DocumentTableRow>
                ) : (
                  paginatedDrafts.map((record) => (
                    <DocumentTableRow key={record.id}>
                      <DocumentTableCell align="left" className="pl-6">
                        <div className="font-medium text-[#5F5E5E]">
                          {record.document_number || record.document_id}{" "}
                          {record.title}
                        </div>
                      </DocumentTableCell>
                      <DocumentTableCell align="center" className="text-[#5C403D] font-medium">
                        {record.created_at
                          ? new Date(record.created_at).toLocaleDateString(
                            "th-TH",
                          )
                          : "—"}
                      </DocumentTableCell>
                      <DocumentTableCell>
                        <div className="flex items-center justify-center gap-4">
                          <ActionIconWithTooltip
                            icon="edit"
                            tooltipText="แก้ไขฉบับร่าง"
                            buttonClassName="text-[#5F5E5E] hover:text-[#00666E]"
                            onClick={() =>
                              router.push(
                                `/data-processor/management/form?id=${record.document_id}&snapshot_id=${record.id}`,
                              )
                            }
                          />
                          <ActionIconWithTooltip
                            icon="delete"
                            tooltipText="ลบฉบับร่าง"
                            buttonClassName="text-[#5F5E5E] hover:text-[#ED393C]"
                            onClick={() => {
                              setDeleteDraftConfirm({
                                open: true,
                                id: record.id,
                              });
                            }}
                          />
                        </div>
                      </DocumentTableCell>
                    </DocumentTableRow>
                  ))
                )}
              </DocumentTableBody>
            </DocumentTable>
            <DocumentPagination
              current={draftPage}
              totalPages={Math.max(
                1,
                Math.ceil(draftRecords.length / DRAFT_ITEMS_PER_PAGE),
              )}
              totalItems={draftRecords.length}
              itemsPerPage={DRAFT_ITEMS_PER_PAGE}
              onChange={setDraftPage}
            />
          </DocumentListCard>
        </div>
      </main>

      <SendToOwnerModal
        isOpen={submitConfirm.open}
        isLoading={isSubmitting}
        onConfirm={() => handleSubmitToDO(submitConfirm.id)}
        onClose={() => setSubmitConfirm({ open: false, id: "" })}
      />

      <ConfirmModal
        isOpen={deleteDraftConfirm.open}
        title="ลบฉบับร่าง"
        description="ต้องการลบฉบับร่างนี้ใช่หรือไม่? การลบจะไม่กระทบข้อมูลปัจจุบันในตารางหลัก"
        confirmText="ลบ"
        onConfirm={() => {
          deleteProcessorRecord(deleteDraftConfirm.id);
          setDeleteDraftConfirm({ open: false, id: "" });
        }}
        onCancel={() => setDeleteDraftConfirm({ open: false, id: "" })}
      />
    </div>
  );
}
