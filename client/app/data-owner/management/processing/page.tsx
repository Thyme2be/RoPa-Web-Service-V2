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
import { useRopa } from "@/context/RopaContext";
import { RopaStatus, SectionStatus } from "@/types/enums";
import { OwnerRecord, ActiveTableItem } from "@/types/dataOwner";
import { cn } from "@/lib/utils";
import { ropaService } from "@/services/ropaService";
import ConfirmModal from "@/components/ropa/ConfirmModal";

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
function StatusBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-[6px] text-[10px] font-bold whitespace-nowrap min-w-[140px] text-center shadow-sm",
        done
          ? "bg-[#107C41] text-white" // Vibrant Green matching the image
          : "bg-[#FFC107] text-[#5C403D]", // Solid Yellow matching the image
      )}
    >
      {label}
    </span>
  );
}

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
  } = useRopa();

  const [page, setPage] = useState(1);
  const [draftPage, setDraftPage] = useState(1);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Fetch new page when page changes
  useEffect(() => {
    fetchActiveTable(page, 3);
  }, [page, fetchActiveTable]);
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

  // Filter State
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7days");
  const [customDate, setCustomDate] = useState("");

  const handleClearFilters = () => {
    setStatusFilter("all");
    setDateFilter("7days");
    setCustomDate("");
  };

  const handleCreateDocument = async (data: {
    name: string;
    company: string;
    dueDate: string;
  }) => {
    setIsCreateModalOpen(false);
    try {
      const result = await ropaService.createDocument({
        title: data.name,
        processor_company: data.company,
        due_date: data.dueDate,
      });

      if (result.document_id) {
        await refresh(); // Refresh dashboards and tables for all roles
        router.push(
          `/data-owner/management/form?id=${result.document_id}&mode=edit`,
        );
      }
    } catch (error) {
      console.error("Failed to create document:", error);
      alert("เกิดข้อผิดพลาดในการสร้างเอกสาร กรุณาลองใหม่อีกครั้ง");
    }
  };

  // ─── Filter processing records ─────────────────────────────────────────────
  // Records in "processing" table are all active records (track status within table)
  const processingRecords = activeRecords;
  const draftRecords = ownerSnapshots;

  const filteredProcessing = processingRecords
    .filter((record) => {
      // Status Filter
      let matchStatus = true;
      const do_code = record.owner_status?.code;
      const dp_code = record.processor_status?.code;

      if (statusFilter !== "all") {
        switch (statusFilter) {
          case "wait_owner":
            matchStatus = do_code !== "DO_DONE";
            break;
          case "wait_processor":
            matchStatus = dp_code !== "DP_DONE";
            break;
          case "done_owner":
            matchStatus = do_code === "DO_DONE";
            break;
          case "done_processor":
            matchStatus = dp_code === "DP_DONE";
            break;
          case "wait_all":
            matchStatus = do_code !== "DO_DONE" && dp_code !== "DP_DONE";
            break;
          case "done_all":
            matchStatus = do_code === "DO_DONE" && dp_code === "DP_DONE";
            break;
          default:
            matchStatus = true;
        }
      }

      // Date Filter (Due Date)
      let matchDate = true;
      if (dateFilter !== "all" && record.due_date) {
        const dueDate = new Date(record.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (dateFilter === "7days") {
          matchDate = diffDays <= 7;
        } else if (dateFilter === "30days") {
          matchDate = diffDays <= 30;
        } else if (dateFilter === "overdue") {
          matchDate = dueDate < today;
        } else if (dateFilter === "custom" && customDate) {
          const cDate = new Date(customDate);
          cDate.setHours(0, 0, 0, 0);
          const dDate = new Date(record.due_date);
          dDate.setHours(0, 0, 0, 0);
          matchDate = cDate.getTime() === dDate.getTime();
        }
      }

      return matchStatus && matchDate;
    })
    .sort((a, b) => {
      // 1. Status Priority (Wait Owner > Wait Processor > Done)
      const getPriority = (r: ActiveTableItem) => {
        if (r.owner_status?.code !== "DO_DONE") return 1;
        if (r.processor_status?.code !== "DP_DONE") return 2;
        return 3;
      };
      const pA = getPriority(a);
      const pB = getPriority(b);
      if (pA !== pB) return pA - pB;

      // 3. Due Date Urgency
      const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;

      // 4. Recency
      const recA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const recB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return recB - recA;
    });

  const filteredDrafts = draftRecords.filter((record) => {
    // Date Filter - Based on Created At (Last Saved) as shown in table
    let matchDate = true;
    if (dateFilter !== "all" && record.created_at) {
      const rowDate = new Date(record.created_at);
      const now = new Date();
      if (dateFilter === "7days") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchDate = rowDate >= sevenDaysAgo;
      } else if (dateFilter === "30days") {
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        matchDate = rowDate >= thirtyDaysAgo;
      } else if (dateFilter === "custom" && customDate) {
        matchDate =
          rowDate.toLocaleDateString() ===
          new Date(customDate).toLocaleDateString();
      }
    } else if (dateFilter !== "all" && !record.created_at) {
      matchDate = false;
    }

    return matchDate;
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
      alert("เกิดข้อผิดพลาดในการส่งให้ DPO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestDelete = (id: string) => {
    router.push(`/data-owner/management/form?id=${id}&mode=deletion`);
  };

  const getDoLabel = (r: ActiveTableItem) =>
    r.owner_status?.code === "DO_DONE"
      ? "Data Owner ดำเนินการเสร็จสิ้น"
      : "รอส่วนของ Data Owner";

  const getDpLabel = (r: ActiveTableItem) =>
    r.processor_status?.code === "DP_DONE"
      ? "Data Processor ดำเนินการเสร็จสิ้น"
      : "รอส่วนของ Data Processor";

  const PROCESSING_ITEMS_PER_PAGE = 3;
  const DRAFT_ITEMS_PER_PAGE = 2;

  // Client-side pagination (Still used for drafts, but processing is now server-side)
  // For processing, we just use the 3 items we got from the server.
  const paginatedProcessing = filteredProcessing.slice(0, PROCESSING_ITEMS_PER_PAGE);
  const totalProcessingPages = Math.ceil(activeMeta.total / PROCESSING_ITEMS_PER_PAGE);

  const paginatedDrafts = filteredDrafts.slice(
    (draftPage - 1) * DRAFT_ITEMS_PER_PAGE,
    draftPage * DRAFT_ITEMS_PER_PAGE,
  );
  const totalDraftPages = Math.ceil(filteredDrafts.length / DRAFT_ITEMS_PER_PAGE);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />

      <main className="w-[calc(100vw-var(--sidebar-width))] ml-[var(--sidebar-width)] min-h-screen flex flex-col bg-surface-container-low">
        <TopBar
          showBack={false}
          backUrl="/data-owner/management"
          pageTitle=" "
          hideSearch={true}
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
                  width="w-[16%]"
                  align="left"
                  className="whitespace-nowrap !text-[12px] pl-6"
                >
                  ชื่อเอกสาร
                </DocumentTableHeader>
                <DocumentTableHeader
                  width="w-[16%]"
                  className="whitespace-nowrap !text-[12px]"
                >
                  ชื่อผู้ประมวลผลข้อมูลส่วนบุคคล
                </DocumentTableHeader>
                <DocumentTableHeader
                  width="w-[16%]"
                  className="whitespace-nowrap !text-[12px]"
                >
                  ชื่อบริษัท
                </DocumentTableHeader>
                <DocumentTableHeader
                  width="w-[12%]"
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
                  className="whitespace-nowrap !text-[12px]"
                >
                  การดำเนินการ
                </DocumentTableHeader>
              </DocumentTableHead>
              <DocumentTableBody>
                {paginatedProcessing.length === 0 ? (
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
                        <div className="font-medium text-[#1B1C1C]">
                          {record.document_number} {record.title}
                        </div>
                      </DocumentTableCell>
                      <DocumentTableCell>
                        <div className="text-[#5C403D]">
                          {record.dp_name || "—"}
                        </div>
                      </DocumentTableCell>
                      <DocumentTableCell className="text-[#5C403D]">
                        {record.dp_company || "—"}
                      </DocumentTableCell>
                      <DocumentTableCell className="text-[#5C403D]">
                        {formatDate(record.due_date)}
                      </DocumentTableCell>
                      <DocumentTableCell>
                        <div className="flex flex-col items-center gap-1 py-1">
                          <StatusBadge
                            done={record.owner_status?.code === "DO_DONE"}
                            label={getDoLabel(record)}
                          />
                          <StatusBadge
                            done={record.processor_status?.code === "DP_DONE"}
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
                <DocumentTableHeader
                  width="w-[50%]"
                  align="left"
                  className="pl-6"
                >
                  ชื่อเอกสาร
                </DocumentTableHeader>
                <DocumentTableHeader width="w-[25%]">
                  บันทึกล่าสุด
                </DocumentTableHeader>
                <DocumentTableHeader width="w-[25%]">
                  การดำเนินการ
                </DocumentTableHeader>
              </DocumentTableHead>
              <DocumentTableBody>
                {paginatedDrafts.length === 0 ? (
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
              totalPages={Math.max(
                1,
                Math.ceil(filteredDrafts.length / DRAFT_ITEMS_PER_PAGE),
              )}
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
            alert("เกิดข้อผิดพลาดในการลบเอกสาร");
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
