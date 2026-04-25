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
import CreateDocumentModal from "@/components/ropa/CreateDocumentModal";
import { useRouter } from "next/navigation";
import { useOwner } from "@/context/OwnerContext";
import { RopaStatus, SectionStatus } from "@/types/enums";
import { OwnerRecord, ActiveTableItem } from "@/types/dataOwner";
import { cn } from "@/lib/utils";
import { ownerService } from "@/services/ownerService";
import ConfirmModal from "@/components/ropa/ConfirmModal";

const PROCESSING_ITEMS_PER_PAGE = 3;
const DRAFT_ITEMS_PER_PAGE = 2;

// ─── Formatting ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | undefined | null) {
  if (!dateStr || dateStr === "—") return "—";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear(); // Use AD (2026) as per sketch yyyy
  return `${day}/${month}/${year}`;
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ code, label }: { code: string; label: string }) {
  const styles: Record<string, string> = {
    DO_DONE: "bg-[#107C41] text-white",      // Green
    DP_DONE: "bg-[#107C41] text-white",      // Green
    WAITING_DO: "bg-[#FFC107] text-[#5C403D]", // Yellow
    WAITING_DP: "bg-[#FFC107] text-[#5C403D]", // Yellow
    DPO_REJECTED: "bg-[#ED393C] text-white",   // Red
  };

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-[6px] text-[10px] font-bold whitespace-nowrap min-w-[140px] text-center shadow-sm",
        styles[code] || "bg-[#9CA3AF] text-white",
      )}
    >
      {label}
    </span>
  );
}

import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import TableLoading from "@/components/ui/TableLoading";

export default function ManagementProcessingPage() {
  const router = useRouter();
  const {
    activeRecords,
    activeMeta,
    ownerSnapshots,
    sendToDpo,
    requestDelete,
    deleteRecord,
    deleteOwnerSnapshot,
    refresh,
    fetchActiveTable,
    isLoading,
    error,
    clearError,
  } = useOwner();

  const [page, setPage] = useState(1);
  const [draftPage, setDraftPage] = useState(1);

  // Filter State
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleClearFilters = () => {
    setStatusFilter("all");
    setDateFilter("all");
    setCustomDate("");
  };

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

  // Fetch new page when filters or search change
  useEffect(() => {
    fetchActiveTable(page, 3, statusFilter, dateFilter, customDate, debouncedSearch);
  }, [page, statusFilter, dateFilter, customDate, debouncedSearch, fetchActiveTable]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Confirm modals
  const [dpoConfirm, setDpoConfirm] = useState<{ open: boolean; id: string }>({
    open: false,
    id: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
  }>({ open: false, id: "" });
  const [deleteDraftConfirm, setDeleteDraftConfirm] = useState<{
    open: boolean;
    id: string;
  }>({ open: false, id: "" });

  const handleCreateDocument = async (data: {
    name: string;
    company: string;
    dueDate: string;
  }) => {
    setIsCreateModalOpen(false);
    try {
      const result = await ownerService.createDocument({
        title: data.name,
        processor_company: data.company,
        due_date: data.dueDate,
      });

      if (result.document_id) {
        await refresh(); // Refresh dashboards and tables for all roles
        router.push(
          `/data-owner/management/form?id=${result.document_id}&mode=create`,
        );
      }
    } catch (error) {
      console.error("Failed to create document:", error);
      alert("เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
    }
  };

  // ─── Filter processing records ─────────────────────────────────────────────
  // Processing table now uses server-side filtering.
  // We just use activeRecords directly as they come filtered from the backend.
  const paginatedProcessing = activeRecords;
  const totalProcessingPages = Math.max(1, Math.ceil(activeMeta.total / PROCESSING_ITEMS_PER_PAGE));

  const filteredDrafts = ownerSnapshots.filter((record) => {
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        (record.document_number?.toLowerCase() || "").includes(searchLower) ||
        (record.title?.toLowerCase() || "").includes(searchLower)
      );
    }
    return true;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Action Handlers ────────────────────────────────────────────────────────
  const handleSendToDpo = async (id: string) => {
    setIsSubmitting(true);
    try {
      await sendToDpo(id);
      setDpoConfirm({ open: false, id: "" });
    } catch (error) {
      console.error("Failed to send to DPO:", error);
      alert("เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestDelete = (id: string) => {
    router.push(`/data-owner/management/form?id=${id}&mode=deletion`);
  };

  const getDoLabel = (r: ActiveTableItem) => r.owner_status?.label || "รอส่วนของ Data Owner";
  const getDpLabel = (r: ActiveTableItem) => r.processor_status?.label || "รอส่วนของ Data Processor";


  const totalDraftPages = Math.max(1, Math.ceil(filteredDrafts.length / DRAFT_ITEMS_PER_PAGE));

  const paginatedDrafts = filteredDrafts.slice(
    (draftPage - 1) * DRAFT_ITEMS_PER_PAGE,
    draftPage * DRAFT_ITEMS_PER_PAGE,
  );

  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex items-center justify-center p-10">
          <ErrorState 
            title="ไม่สามารถโหลดข้อมูลเอกสารได้" 
            message={error} 
            onRetry={() => { clearError(); refresh(); }} 
          />
        </main>
      </div>
    );
  }

  const isInitialLoading = isLoading && !activeRecords.length && !ownerSnapshots.length;

  if (isInitialLoading) {
    return <LoadingState fullPage message="กำลังโหลด..." />;
  }

  return (
    <div className="flex min-h-screen bg-background font-sans relative">
      <Sidebar />

      <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
        <TopBar
          showBack={false}
          backUrl="/data-owner/management"
          pageTitle=" "
          hideSearch={false}
          searchQuery={searchQuery}
          onSearchChange={(e: any) => setSearchQuery(e.target.value)}
        />

        <div className="p-10 space-y-10">
          <div className="flex justify-between items-center">
            <h1 className="text-[28px] font-black text-[#1B1C1C] tracking-tight">
              ตารางแสดงเอกสารที่ดำเนินการ
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#ED393C] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold hover:brightness-110 transition-all shadow-md shadow-red-900/10"
            >
              <span className="material-symbols-rounded">add</span>
              สร้างเอกสาร
            </button>
          </div>

          <DocumentFilterBar
            statusValue={statusFilter}
            onStatusChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            dateValue={dateFilter}
            onDateChange={(val) => {
              setDateFilter(val);
              setPage(1);
              setDraftPage(1);
            }}
            customDate={customDate}
            onCustomDateChange={(val) => {
              setCustomDate(val);
              setPage(1);
              setDraftPage(1);
            }}
            onClear={handleClearFilters}
          />

          {/* ─── Processing Table ─────────────────────────────────── */}
          <DocumentListCard
            title="เอกสารที่ดำเนินการ"
            icon="check_circle"
            iconColor="#0D9488"
            bodyClassName="p-0"
          >
            <DocumentTable>
              <DocumentTableHead>
                <DocumentTableHeader
                  width="w-[18%]"
                  align="center"
                  className="whitespace-nowrap !text-[12px]"
                >
                  ชื่อเอกสาร
                </DocumentTableHeader>
                <DocumentTableHeader
                  width="w-[18%]"
                  align="center"
                  className="whitespace-nowrap !text-[12px]"
                >
                  ชื่อผู้ประมวลผลข้อมูลส่วนบุคคล
                </DocumentTableHeader>
                <DocumentTableHeader
                  width="w-[15%]"
                  align="center"
                  className="whitespace-nowrap !text-[12px]"
                >
                  ชื่อบริษัท
                </DocumentTableHeader>
                <DocumentTableHeader
                  width="w-[12%]"
                  align="center"
                  className="whitespace-nowrap !text-[12px]"
                >
                  วันที่กำหนดส่ง
                </DocumentTableHeader>
                <DocumentTableHeaderWithTooltip
                  width="w-[28%]"
                  className="whitespace-nowrap !text-[12px]"
                  title="สถานะ"
                  tooltipText={
                    <div className="space-y-1">
                      <p>
                        <span className="w-24 inline-block font-bold text-[#1B1C1C]">
                          Data Owner
                        </span>{" "}
                        หมายถึง ผู้รับผิดชอบข้อมูล
                      </p>
                      <p>
                        <span className="w-24 inline-block font-bold text-[#1B1C1C]">
                          Data Processor
                        </span>{" "}
                        หมายถึง ผู้ประมวลผลข้อมูลส่วนบุคคล
                      </p>
                    </div>
                  }
                />
                <DocumentTableHeader
                  width="w-[12%]"
                  align="center"
                  className="whitespace-nowrap !text-[12px]"
                >
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
                        ไม่พบเอกสารที่ดำเนินการ
                      </span>
                    </DocumentTableCell>
                  </DocumentTableRow>
                ) : (
                  paginatedProcessing.map((record) => (
                    <DocumentTableRow key={record.document_id}>
                      <DocumentTableCell align="left" className="pl-6">
                        <div className="font-medium text-[#5F5E5E]">
                          {record.document_number} {record.title}
                        </div>
                      </DocumentTableCell>
                      <DocumentTableCell align="center">
                        <div className="text-[#5C403D] font-medium">
                          {record.dp_name || "—"}
                        </div>
                      </DocumentTableCell>
                      <DocumentTableCell align="center" className="text-[#5C403D]">
                        {record.dp_company || "—"}
                      </DocumentTableCell>
                      <DocumentTableCell align="center" className="text-[#5C403D]">
                        {formatDate(record.due_date)}
                      </DocumentTableCell>
                      <DocumentTableCell>
                        <div className="flex flex-col items-center gap-1 py-1">
                          <StatusBadge
                            code={record.owner_status?.code || "WAITING_DO"}
                            label={getDoLabel(record)}
                          />
                          <StatusBadge
                            code={record.processor_status?.code || "WAITING_DP"}
                            label={getDpLabel(record)}
                          />
                        </div>
                      </DocumentTableCell>
                      <DocumentTableCell>
                        {(() => {
                          const isSendToDpoDisabled =
                            record.owner_status?.code !== "DO_DONE" ||
                            record.processor_status?.code !== "DP_DONE" ||
                            !record.is_risk_complete ||
                            record.deletion_status === "DELETE_PENDING";
                          let dpoTooltip =
                            "ส่งให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลตรวจสอบ";
                          if (isSendToDpoDisabled) {
                            if (record.deletion_status === "DELETE_PENDING") {
                              dpoTooltip = "รอยื่นคำร้องขอทำลาย ไม่สามารถส่งได้";
                            } else {
                              const missing = [];
                              if (record.owner_status?.code !== "DO_DONE")
                                missing.push("ส่วนของ DO");
                              if (record.processor_status?.code !== "DP_DONE")
                                missing.push("ส่วนของ DP");
                              if (!record.is_risk_complete)
                                missing.push("การประเมินความเสี่ยง");
                              dpoTooltip = `ต้องดำเนินการ${missing.join(", ")}ให้เสร็จก่อน`;
                            }
                          }

                          return (
                            <div className="flex items-center justify-center gap-3">
                              <ActionIconWithTooltip
                                icon="visibility"
                                tooltipText="ดูเอกสาร"
                                buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]"
                                onClick={() => {
                                  const mode = (record.owner_status?.code === "DO_DONE" || record.deletion_status === "DELETE_PENDING") ? "view" : "edit";
                                  router.push(
                                    `/data-owner/management/form?id=${record.document_id}&mode=${mode}`,
                                  );
                                }}

                              />
                              <ActionIconWithTooltip
                                icon="send"
                                disabled={isSendToDpoDisabled}
                                tooltipText={dpoTooltip}
                                buttonClassName={
                                  isSendToDpoDisabled
                                    ? "text-[#9CA3AF] cursor-not-allowed"
                                    : "text-[#5F5E5E] hover:text-[#1B1C1C]"
                                }
                                onClick={() =>
                                  !isSendToDpoDisabled &&
                                  setDpoConfirm({
                                    open: true,
                                    id: record.document_id,
                                  })
                                }
                              />
                              <ActionIconWithTooltip
                                icon="cancel_schedule_send"
                                disabled={record.deletion_status === "DELETE_PENDING" || isSubmitting}
                                tooltipText={record.deletion_status === "DELETE_PENDING" ? "รอยื่นคำร้องขอทำลาย" : "ยื่นคำร้องขอทำลายเอกสารให้ DPO"}
                                buttonClassName={record.deletion_status === "DELETE_PENDING" ? "text-amber-500 cursor-not-allowed" : "text-[#5F5E5E] hover:text-[#ED393C]"}
                                onClick={() => record.deletion_status !== "DELETE_PENDING" && router.push(`/data-owner/management/form?id=${record.document_id}&mode=deletion`)}
                              />
                            </div>
                          );
                        })()}
                      </DocumentTableCell>
                    </DocumentTableRow>
                  ))
                )}
              </DocumentTableBody>
            </DocumentTable>
            <DocumentPagination
              current={page}
              totalPages={totalProcessingPages}
              totalItems={activeMeta.total}
              itemsPerPage={PROCESSING_ITEMS_PER_PAGE}
              onChange={setPage}
            />
          </DocumentListCard>

          {/* ─── Draft Table ──────────────────────────────────────── */}
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
                      <DocumentTableCell
                        align="left"
                        className="pl-6 font-medium"
                      >
                        <div className="text-[#5F5E5E]">
                          {record.document_number} {record.title}
                        </div>
                      </DocumentTableCell>
                      <DocumentTableCell className="text-[#5F5E5E] font-medium text-center">
                        {formatDate(record.created_at)}
                      </DocumentTableCell>
                      <DocumentTableCell>
                        <div className="flex items-center justify-center gap-4">
                          <ActionIconWithTooltip
                            icon="edit"
                            tooltipText="แก้ไขฉบับร่าง"
                            buttonClassName="text-[#5F5E5E] hover:text-[#1B1C1C]"
                            onClick={() =>
                              router.push(
                                `/data-owner/management/form?id=${record.document_id}&snapshot_id=${record.id}`,
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
              totalPages={totalDraftPages}
              totalItems={filteredDrafts.length}
              itemsPerPage={DRAFT_ITEMS_PER_PAGE}
              onChange={setDraftPage}
            />
          </DocumentListCard>
        </div>

        <CreateDocumentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateDocument}
        />
      </main>

      {/* ─── Confirm: ส่ง DPO ─────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={dpoConfirm.open}
        isLoading={isSubmitting}
        title="ส่งให้เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล"
        description="เอกสารนี้จะถูกส่งให้ DPO ตรวจสอบ และจะย้ายออกจากตารางเอกสารที่ดำเนินการ"
        confirmText="ยืนยันการส่ง"
        onConfirm={() => handleSendToDpo(dpoConfirm.id)}
        onCancel={() => setDpoConfirm({ open: false, id: "" })}
      />

      {/* ─── Confirm: ขอลบ ────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteConfirm.open}
        isLoading={isSubmitting}
        title="ลบเอกสาร"
        description="ต้องการลบเอกสารนี้ออกจากระบบใช่หรือไม่? ข้อควรระวัง: การลบจะเป็นการลบข้อมูลถาวร ไม่สามารถกู้คืนได้ และควรทำเฉพาะกับเอกสารที่ยังไม่ได้ส่งตรวจสอบ"
        confirmText="ลบถาวร"
        onConfirm={async () => {
          setIsSubmitting(true);
          try {
            await deleteRecord(deleteConfirm.id, "IN_PROGRESS");
            setDeleteConfirm({ open: false, id: "" });
          } catch (error) {
            console.error("Failed to delete record:", error);
            alert("เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
          } finally {
            setIsSubmitting(false);
          }
        }}
        onCancel={() => setDeleteConfirm({ open: false, id: "" })}
      />

      {/* ─── Confirm: ลบฉบับร่าง ─────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteDraftConfirm.open}
        isLoading={isSubmitting}
        title="ลบฉบับร่าง"
        description="ต้องการลบฉบับร่างนี้ใช่หรือไม่? การลบจะไม่กระทบข้อมูลปัจจุบันในตารางหลัก"
        confirmText="ลบ"
        onConfirm={async () => {
          setIsSubmitting(true);
          try {
            await deleteOwnerSnapshot(deleteDraftConfirm.id);
            setDeleteDraftConfirm({ open: false, id: "" });
          } finally {
            setIsSubmitting(false);
          }
        }}
        onCancel={() => setDeleteDraftConfirm({ open: false, id: "" })}
      />
    </div>
  );
}
