"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Phone, UserPlus, PhoneOutgoing, CarFront } from "lucide-react";
import clsx from "clsx";
import {
  fetchNewLeads,
  fetchFollowUps,
  fetchTaskVisits,
  type FeedLead,
  type FeedVisit,
} from "@/lib/api";

const TABS = [
  { id: "new-lead", label: "New Lead", icon: UserPlus },
  { id: "followup", label: "Followup", icon: PhoneOutgoing },
  { id: "task-visit", label: "Task/Visit", icon: CarFront },
] as const;

type TabId = (typeof TABS)[number]["id"];

function LeadRow({ lead }: { lead: FeedLead }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-[12px] text-ink-faint font-mono tracking-tight">ID- {lead.leadId}</p>
        <p className="text-[13.5px] font-medium text-ink truncate">{lead.name}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[12px] text-accent-strong font-medium">Caller - {lead.caller}</span>
        <button
          aria-label={`Call ${lead.name}`}
          className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-ink-muted hover:text-accent-strong hover:border-accent transition-colors"
        >
          <Phone size={13} />
        </button>
      </div>
    </div>
  );
}

export function LiveFeed() {
  const [active, setActive] = useState<TabId>("new-lead");
  const [newLeads, setNewLeads] = useState<FeedLead[]>([]);
  const [followUps, setFollowUps] = useState<FeedLead[]>([]);
  const [visits, setVisits] = useState<FeedVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchNewLeads(), fetchFollowUps(), fetchTaskVisits()]).then(
      ([leads, follows, tasks]) => {
        setNewLeads(leads);
        setFollowUps(follows);
        setVisits(tasks);
        setLoading(false);
      },
    );
  }, []);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={clsx(
                "relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-medium transition-colors",
                isActive ? "text-accent-strong" : "text-ink-muted hover:text-ink",
              )}
            >
              <Icon size={13.5} />
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="feed-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 min-h-[168px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-[12.5px] text-ink-faint"
            >
              Loading…
            </motion.div>
          ) : (
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
            >
              {active === "new-lead" &&
                (newLeads.length ? (
                  newLeads.map((lead) => <LeadRow key={lead.id} lead={lead} />)
                ) : (
                  <EmptyState label="No new leads yet" />
                ))}
              {active === "followup" &&
                (followUps.length ? (
                  followUps.map((lead) => <LeadRow key={lead.id} lead={lead} />)
                ) : (
                  <EmptyState label="No follow-ups logged" />
                ))}
              {active === "task-visit" &&
                (visits.length ? (
                  visits.map((v) => (
                    <p key={v.id} className="py-4 text-[13px] text-ink-muted text-center">
                      {v.message}
                    </p>
                  ))
                ) : (
                  <EmptyState label="No visits scheduled" />
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="py-8 text-center text-[12.5px] text-ink-faint">{label}</p>;
}
