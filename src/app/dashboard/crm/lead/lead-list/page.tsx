"use client";

import React, { useState, useRef, useEffect } from "react";
import LeadHeader from "./components/LeadHeader";
import LeadTable from "./components/LeadTable";
import CallActivityView from "./components/CallActivityView";
import NewEditModal from "./modals/NewEditModal";
import CallAssignModal from "./modals/CallAssignModal";
import BulkImportModal from "./modals/BulkImportModal";
import SmsModals from "./modals/SmsModals";
import TransferModal from "./modals/TransferModal";
import AlertDeleteModals from "./modals/AlertDeleteModals";
import { crmLeadApi, mapLead } from "@/services/crmLeadApi";

interface LeadRecord {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  secondaryNumber?: string;
  address?: string;
  organization?: string;
  designation?: string;
  email?: string;
  badge: string;
  srOfficer: string;
  srOfficerId?: string;
  cr: string;
  crId?: string;
  avatarUrl?: string;
  leadSource?: string;
  leadSourceId?: number;
  interestedProject?: string;
  interestedProjectId?: string;
  leadCategory?: string;
  leadCategoryId?: number;
  campaign?: string;
  campaignId?: number;
  birthDate?: string;
  anniversaryDate?: string;
  profession?: string;
  professionId?: number;
  stageId?: number;
  status?: string;
  createdAt?: string;
  lastActivity?: string;
  nextActivity?: string;
  remark?: string;
  query?: string;
}

const mockLeadsData: LeadRecord[] = [
  {
    id: "lead-1",
    leadId: "L261015-0135",
    name: "jannati2222232323",
    phone: "1754252246",
    badge: "JUNK",
    srOfficer: "Admin",
    cr: "Select CR",
    createdAt: "15-10-2026 04:10:PM",
    lastActivity: "Call Connected\nNote: Interested in 3 BHK",
    nextActivity: "25-10-2026 11:00 AM\nFollow up call",
    organization: "sdfs",
    designation: "sfsd",
    address: "shatkhira",
    leadSource: "Linkedin"
  },
  {
    id: "lead-2",
    leadId: "L261015-0134",
    name: "Engr.Syed Sagor Ali",
    phone: "1709825133",
    address: "Road No.01, Avenue 03, House-160, Mirpur-12, DOHS, Dhaka",
    organization: "PJS CONSULT ANT FIRM",
    designation: "Engineer",
    badge: "Priority",
    srOfficer: "Admin",
    cr: "Select CR",
    createdAt: "15-10-2026 02:20:PM",
    lastActivity: "Follow Up\nSent project brochure",
    nextActivity: "24-10-2026 03:00 PM\nSite Visit",
  },
  {
    id: "lead-3",
    leadId: "L261012-0132",
    name: "Kazi Mohammad Aseem",
    phone: "1963610277",
    organization: "Madina Group",
    designation: "Executive Director",
    badge: "Prospect",
    srOfficer: "Mohin",
    cr: "Tazmul Reza",
    createdAt: "12-10-2026 11:15:AM",
    lastActivity: "No Answer\nTried calling 2 times",
    nextActivity: "23-10-2026 05:00 PM\nCall again",
  },
];

export default function LeadListPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [leadOptions, setLeadOptions] = useState<Record<string, any[]>>({});
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const refreshLeads = async (filters: Record<string, any> = {}) => {
    setIsLoadingLeads(true);
    try {
      const result = await crmLeadApi.listAllLeads(filters);
      setLeads(result.data as LeadRecord[]);
    } catch (error) {
      console.error("Failed to load CRM leads", error);
      setLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  };
  useEffect(() => {
    void refreshLeads();
    Promise.all(["category", "source", "campaign", "profession", "area", "team", "project", "user", "stage", "status", "occasion", "lead-type"].map(async (key) => {
      try { return [key, await crmLeadApi.dropdown(key)] as const; }
      catch (error) { console.error(`Failed to load CRM ${key} options`, error); return [key, []] as const; }
    })).then((entries) => setLeadOptions(Object.fromEntries(entries)));
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("January 1, 1971 - October 22, 2026");
  const currentLeadQuery = () => {
    const [start, end] = filterDateRange.split(" - ");
    const from = start ? new Date(start) : null;
    const to = end ? new Date(end) : null;
    return {
      ...(filterTeamId ? { teamId: filterTeamId } : {}),
      ...(from && !Number.isNaN(from.getTime()) ? { dateFrom: from.toISOString().slice(0, 10) } : {}),
      ...(to && !Number.isNaN(to.getTime()) ? { dateTo: to.toISOString().slice(0, 10) } : {}),
    };
  };

  const [isNewOrEditModalOpen, setIsNewOrEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(true);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);

  const [isCallAssignOpen, setIsCallAssignOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isWishSmsOpen, setIsWishSmsOpen] = useState(false);
  const [isSmsConfirmOpen, setIsSmsConfirmOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const [callAssignDate, setCallAssignDate] = useState("");
  const [callAssignUserType, setCallAssignUserType] = useState("Officer/SR");
  const [callAssignNote, setCallAssignNote] = useState("");

  const [transferUser, setTransferUser] = useState("");
  const [transferType, setTransferType] = useState("Officer/SR");
  const [transferFollowup, setTransferFollowup] = useState(false);
  const [transferManualSet, setTransferManualSet] = useState(false);

  const [smsTemplate, setSmsTemplate] = useState("");
  const [smsText, setSmsText] = useState("");

  const [activeLead, setActiveLead] = useState<LeadRecord | null>(null);
  const [leadDetailTabs, setLeadDetailTabs] = useState<Record<string, any[]>>({});

  const [isCallActivityPageOpen, setIsCallActivityPageOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("Upcoming/Pending");
  const [currentActivity, setCurrentActivity] = useState("Followup");
  const [nextActivityType, setNextActivityType] = useState("Followup");
  const [followupStatus, setFollowupStatus] = useState("");
  const [followupComment, setFollowupComment] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [nextFollowupNote, setNextFollowupNote] = useState("");
  const [isJunk, setIsJunk] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [reqPrice, setReqPrice] = useState("");
  const [reqSize, setReqSize] = useState("");
  const [reqArea, setReqArea] = useState("");
  const [reqType, setReqType] = useState("");
  const [reqDesc, setReqDesc] = useState("");

  const [propProject, setPropProject] = useState("");
  const [noteInput, setNoteInput] = useState("");

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    date: "2026-10-22",
    leadCode: "L261022-0136",
    name: "",
    phone: "",
    secondaryNumber: "",
    assignUser: "Admin",
    ifCr: "",
    leadStages: "New Assignment",
    leadSource: "",
    interestedProject: "",
    leadCategory: "",
    campaign: "",
    organization: "",
    designation: "",
    birthDate: "",
    anniversaryDate: "",
    profession: "",
    address: "",
    email: "",
  });

  const tabs = [
    { name: "Upcoming/Pending", count: null },
    { name: "Requirements", count: 0 },
    { name: "Deal Negotiation", count: 0 },
    { name: "Property", count: 0 },
    { name: "Follow-up", count: 1 },
    { name: "Visits", count: 0 },
    { name: "Note", count: 0 },
  ];

  const verifySelection = (actionCallback: () => void) => {
    if (selectedLeads.length === 0) {
      setIsAlertOpen(true);
    } else {
      actionCallback();
    }
  };

  const handleOpenNewModal = () => {
    setActiveLead(null);
    setFormData({
      date: "2026-10-22",
      leadCode: `L261022-0${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      phone: "",
      secondaryNumber: "",
      assignUser: leadOptions.user?.find((user: any) => user.name === "Admin")?.uuid ?? leadOptions.user?.[0]?.uuid ?? "",
      ifCr: "",
      leadStages: "New Assignment",
      leadSource: "",
      interestedProject: "",
      leadCategory: "",
      campaign: "",
      organization: "",
      designation: "",
      birthDate: "",
      anniversaryDate: "",
      profession: "",
      address: "",
      email: "",
    });
    setIsNewOrEditModalOpen(true);
  };

  const handleOpenEditModal = (item: LeadRecord) => {
    setActiveLead(item);
    setFormData({
      date: "2026-10-22",
      leadCode: item.leadId,
      name: item.name,
      phone: item.phone,
      secondaryNumber: item.secondaryNumber || "",
      assignUser: item.srOfficerId || "",
      ifCr: item.crId || "",
      leadStages: item.badge || "New Assignment",
      leadSource: item.leadSource || "",
      interestedProject: item.interestedProject || "",
      leadCategory: item.leadCategory || "",
      campaign: item.campaign || "",
      organization: item.organization || "",
      designation: item.designation || "",
      birthDate: item.birthDate || "",
      anniversaryDate: item.anniversaryDate || "",
      profession: item.profession || "",
      address: item.address || "",
      email: item.email || "",
    });
    setIsNewOrEditModalOpen(true);
  };

  const handleOpenCallActivityPage = (item: LeadRecord) => {
    setActiveLead(item);
    setFollowupStatus("");
    setFollowupComment("");
    setNextFollowupDate("");
    setNextFollowupNote("");
    setIsJunk(item.badge === "JUNK" || item.badge === "Junk");
    setIsCallActivityPageOpen(true);
    void crmLeadApi.details(item.id).then((detail: any) => {
      const mapped = mapLead(detail);
      setActiveLead({ ...item, ...mapped } as LeadRecord);
      setLeadDetailTabs(detail?.tabs ?? {});
    }).catch((error) => console.error("Failed to load lead activity details", error));
  };

  const handleOpenDeleteModal = (item: LeadRecord) => {
    setActiveLead(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!activeLead) return;
    void crmLeadApi.deleteLead(activeLead.id).then(() => refreshLeads()).then(() => {
      setIsDeleteModalOpen(false); setActiveLead(null);
    }).catch((error) => console.error("Failed to delete lead", error));
  };

  const handleCallAssign = async () => {
    const parsedDate = callAssignDate ? new Date(callAssignDate) : undefined;
    if (parsedDate && Number.isNaN(parsedDate.getTime())) { console.error("Enter a valid call assignment date"); return; }
    try {
      await crmLeadApi.callAssign({ leadUuids: selectedLeads, date: parsedDate?.toISOString(), assignUserType: callAssignUserType, note: callAssignNote });
      await refreshLeads(); setIsCallAssignOpen(false); setSelectedLeads([]); setCallAssignDate(""); setCallAssignNote("");
    } catch (error) { console.error("Failed to schedule call assignment", error); }
  };

  // ট্রান্সফার কনফার্ম করার ফাংশন (যাতে Transfer History পেজে ডেটা যায়)
  const handleConfirmTransfer = async () => {
    const targetUser = leadOptions.user?.find((user: any) => user.uuid === transferUser || user.name === transferUser);
    if (!targetUser) { console.error("Choose a valid active user before transferring leads"); return; }
    try {
      await crmLeadApi.transfer({ leadUuids: selectedLeads, assignments: [{ userId: targetUser.uuid, quantity: selectedLeads.length }], assignType: transferType, followup: transferFollowup, manualSet: transferManualSet });
      await refreshLeads(); setIsTransferOpen(false); setSelectedLeads([]); setTransferUser("");
    } catch (error) { console.error("Failed to transfer leads", error); }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const byName = (items: any[] = [], value: string) => items.find((item) => item.uuid === value || String(item.id) === value || item.name?.toLowerCase() === value?.toLowerCase());
    const user = byName(leadOptions.user, formData.assignUser);
    const cr = byName(leadOptions.user, formData.ifCr);
    const stage = byName(leadOptions.stage, formData.leadStages);
    const source = byName(leadOptions.source, formData.leadSource);
    const category = byName(leadOptions.category, formData.leadCategory);
    const campaign = byName(leadOptions.campaign, formData.campaign);
    const profession = byName(leadOptions.profession, formData.profession);
    const project = byName(leadOptions.project, formData.interestedProject);
    const payload = {
      clientName: formData.name, phone: formData.phone, alternatePhone: formData.secondaryNumber || undefined,
      leadCode: activeLead ? undefined : formData.leadCode, leadDate: formData.date || new Date().toISOString().slice(0, 10),
      assignedTo: user?.uuid ?? activeLead?.srOfficerId ?? undefined, creditOfficerId: cr?.uuid ?? activeLead?.crId ?? undefined,
      leadStageId: stage?.id ?? activeLead?.stageId ?? undefined, leadSourceId: source?.id ?? activeLead?.leadSourceId ?? undefined,
      leadCategoryId: category?.id ?? activeLead?.leadCategoryId ?? undefined, campaignId: campaign?.id ?? activeLead?.campaignId ?? undefined,
      professionId: profession?.id ?? activeLead?.professionId ?? undefined, projectId: project?.uuid ?? activeLead?.interestedProjectId ?? undefined,
      projectName: formData.interestedProject || undefined, organization: formData.organization, designation: formData.designation,
      birthDate: formData.birthDate || undefined, anniversaryDate: formData.anniversaryDate || undefined,
      presentAddress: formData.address, email: formData.email || undefined, initialRemark: activeLead?.remark,
    };
    try {
      if (activeLead) await crmLeadApi.updateLead(activeLead.id, payload);
      else await crmLeadApi.createLead(payload);
      await refreshLeads(); setIsNewOrEditModalOpen(false);
    } catch (error) { console.error("Failed to save lead", error); }
  };

  const handleSaveCallPageChanges = async () => {
    if (!activeLead) return;
    try {
      const stage = leadOptions.stage?.find((item: any) => item.id === activeLead.stageId || item.name === activeLead.badge);
      await crmLeadApi.updateLead(activeLead.id, {
        clientName: activeLead.name, phone: activeLead.phone, email: activeLead.email, presentAddress: activeLead.address,
        organization: activeLead.organization, designation: activeLead.designation, leadStageId: stage?.id ?? activeLead.stageId,
        leadCategoryId: activeLead.leadCategoryId, leadSourceId: activeLead.leadSourceId, campaignId: activeLead.campaignId,
        professionId: activeLead.professionId, assignedTo: activeLead.srOfficerId, creditOfficerId: activeLead.crId,
        initialRemark: activeLead.remark, status: isJunk ? "junk" : activeLead.status,
      });
      if (followupStatus || followupComment || nextFollowupDate) await crmLeadApi.addActivity(activeLead.id, {
        activityType: currentActivity === "Task/Visit" ? "task_visit" : "followup",
        comment: followupComment || followupStatus || "Follow-up", communicationStatus: followupStatus || undefined,
        activityDate: new Date().toISOString(), nextFollowupDate: nextFollowupDate || undefined,
        feedback: nextFollowupNote || undefined, leadStageId: stage?.id, leadStatus: isJunk ? "junk" : undefined,
        junkNote: isJunk ? activeLead.remark : undefined,
      });
      await refreshLeads(); setIsCallActivityPageOpen(false);
    } catch (error) { console.error("Failed to save lead activity", error); }
  };

  const handleMarkAsSold = async () => {
    if (!activeLead) return;
    try { await crmLeadApi.updateLead(activeLead.id, { status: "converted", priority: "Sold" }); await refreshLeads(); setActiveLead({ ...activeLead, badge: "Sold", status: "converted" }); }
    catch (error) { console.error("Failed to mark lead as sold", error); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeLead) {
      console.warn(`Avatar upload is not supported by the current CRM API: ${file.name}`);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) console.warn(`Attachment upload requires a file storage API: ${file.name}`);
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === currentTableData.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(currentTableData.map((item) => item.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter((item) => item !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const filteredData = leads.filter((item) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.phone.includes(search) ||
      item.leadId.toLowerCase().includes(search);

    const matchesCategory =
      !filterCategory ||
      (item.leadCategory &&
        item.leadCategory.trim().toLowerCase() === filterCategory.trim().toLowerCase());

    const matchesProject =
      !filterProject ||
      (item.interestedProject &&
        item.interestedProject.trim().toLowerCase() === filterProject.trim().toLowerCase());

    return matchesSearch && matchesCategory && matchesProject;
  });

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  if (isCallActivityPageOpen && activeLead) {
    return (
      <CallActivityView
        activeLead={activeLead}
        setActiveLead={setActiveLead}
        setIsCallActivityPageOpen={setIsCallActivityPageOpen}
        handleSaveCallPageChanges={handleSaveCallPageChanges}
        isJunk={isJunk}
        setIsJunk={setIsJunk}
        fileInputRef={fileInputRef}
        attachmentInputRef={attachmentInputRef}
        handleImageUpload={handleImageUpload}
        handleAttachmentUpload={handleAttachmentUpload}
        setIsSmsOpen={setIsSmsOpen}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleMarkAsSold={handleMarkAsSold}
        currentActivity={currentActivity}
        setCurrentActivity={setCurrentActivity}
        followupStatus={followupStatus}
        setFollowupStatus={setFollowupStatus}
        followupComment={followupComment}
        setFollowupComment={setFollowupComment}
        nextActivityType={nextActivityType}
        setNextActivityType={setNextActivityType}
        nextFollowupDate={nextFollowupDate}
        setNextFollowupDate={setNextFollowupDate}
        nextFollowupNote={nextFollowupNote}
        setNextFollowupNote={setNextFollowupNote}
        reqPrice={reqPrice}
        setReqPrice={setReqPrice}
        reqSize={reqSize}
        setReqSize={setReqSize}
        reqArea={reqArea}
        setReqArea={setReqArea}
        reqType={reqType}
        setReqType={setReqType}
        reqDesc={reqDesc}
        setReqDesc={setReqDesc}
        propProject={propProject}
        setPropProject={setPropProject}
        noteInput={noteInput}
        setNoteInput={setNoteInput}
        detailTabs={leadDetailTabs}
      />
    );
  }

  return (
    <div className="w-full space-y-6 px-4 md:px-8 py-6 text-foreground bg-slate-50/50 dark:bg-background min-h-screen">
      <LeadHeader
        selectedCount={selectedLeads.length}
        onOpenNewModal={handleOpenNewModal}
        onCallAssign={() => verifySelection(() => setIsCallAssignOpen(true))}
        onBulkImport={() => setIsBulkImportOpen(true)}
        onSendSms={() => verifySelection(() => setIsSmsOpen(true))}
        onConvertCustomer={() => verifySelection(() => alert(`${selectedLeads.length} leads converted to customer!`))}
        onTransfer={() => verifySelection(() => setIsTransferOpen(true))}
        onWishSms={() => verifySelection(() => setIsWishSmsOpen(true))}
        isFilterPanelOpen={isFilterPanelOpen}
        setIsFilterPanelOpen={setIsFilterPanelOpen}
      />

      {isFilterPanelOpen && (
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold animate-in fade-in">
          <div>
            <label className="block text-muted-foreground mb-1">Select Date</label>
            <input type="text" value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)} onBlur={() => void refreshLeads(currentLeadQuery())} className="w-full p-2 border rounded-lg bg-background border-border" />
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">Lead Category</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border rounded-lg bg-background border-border"
            >
              <option value="">Select Category</option>
              {(leadOptions.category ?? []).map((item: any) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">Teams</label>
            <select value={filterTeamId} onChange={(e) => { setFilterTeamId(e.target.value); void refreshLeads({ ...currentLeadQuery(), teamId: e.target.value || undefined }); }} className="w-full p-2 border rounded-lg bg-background border-border">
              <option value="">Select Team</option>
              {(leadOptions.team ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">Interested Project</label>
            <select
              value={filterProject}
              onChange={(e) => {
                setFilterProject(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border rounded-lg bg-background border-border"
            >
              <option value="">Select Project</option>
              {(leadOptions.project ?? []).map((item: any) => <option key={item.uuid} value={item.name}>{item.name}</option>)}
            </select>
          </div>
        </div>
      )}

      <LeadTable
        currentTableData={currentTableData}
        selectedLeads={selectedLeads}
        handleSelectAll={handleSelectAll}
        handleSelectOne={handleSelectOne}
        handleOpenEditModal={handleOpenEditModal}
        handleOpenCallActivityPage={handleOpenCallActivityPage}
        handleOpenDeleteModal={handleOpenDeleteModal}
        entriesPerPage={entriesPerPage}
        setEntriesPerPage={setEntriesPerPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        indexOfFirstItem={indexOfFirstItem}
        indexOfLastItem={indexOfLastItem}
        handlePageChange={handlePageChange}
      />

      <NewEditModal
        isOpen={isNewOrEditModalOpen}
        onClose={() => setIsNewOrEditModalOpen(false)}
        onSubmit={handleFormSubmit}
        formData={formData}
        setFormData={setFormData}
        activeLead={activeLead}
        isLeadDetailsOpen={isLeadDetailsOpen}
        setIsLeadDetailsOpen={setIsLeadDetailsOpen}
        isPersonalInfoOpen={isPersonalInfoOpen}
        setIsPersonalInfoOpen={setIsPersonalInfoOpen}
        options={leadOptions}
      />

      <CallAssignModal
        isOpen={isCallAssignOpen}
        onClose={() => setIsCallAssignOpen(false)}
        callAssignDate={callAssignDate}
        setCallAssignDate={setCallAssignDate}
        callAssignUserType={callAssignUserType}
        setCallAssignUserType={setCallAssignUserType}
        callAssignNote={callAssignNote}
        setCallAssignNote={setCallAssignNote}
        onSubmit={handleCallAssign}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      <SmsModals
        isSmsOpen={isSmsOpen}
        isWishSmsOpen={isWishSmsOpen}
        onCloseSms={() => {
          setIsSmsOpen(false);
          setIsWishSmsOpen(false);
        }}
        smsTemplate={smsTemplate}
        setSmsTemplate={setSmsTemplate}
        smsText={smsText}
        setSmsText={setSmsText}
        onSubmitSms={() => {
          setIsSmsOpen(false);
          setIsWishSmsOpen(false);
          setIsSmsConfirmOpen(true);
        }}
        isSmsConfirmOpen={isSmsConfirmOpen}
        onCloseConfirm={() => setIsSmsConfirmOpen(false)}
        onConfirmOk={() => {
          alert("SMS sent successfully!");
          setIsSmsConfirmOpen(false);
        }}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        selectedCount={selectedLeads.length}
        transferUser={transferUser}
        setTransferUser={setTransferUser}
        transferType={transferType}
        setTransferType={setTransferType}
        transferFollowup={transferFollowup}
        setTransferFollowup={setTransferFollowup}
        transferManualSet={transferManualSet}
        setTransferManualSet={setTransferManualSet}
        onConfirmTransfer={handleConfirmTransfer}
      />

      <AlertDeleteModals
        isAlertOpen={isAlertOpen}
        onCloseAlert={() => setIsAlertOpen(false)}
        isDeleteModalOpen={isDeleteModalOpen}
        onCloseDelete={() => setIsDeleteModalOpen(false)}
        activeLead={activeLead}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
