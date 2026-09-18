import * as React from "react";
import { AudioLines, BookOpen, CloudUpload, ListTodo, Waypoints } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";

import { NavAdmin } from "~/components/nav-admin";
import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "~/components/ui/sidebar";
import { useCurrentUser } from "~/api/queries/useCurrentUser";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const location = useLocation();
  const isAdmin = user.data?.role === "admin";
  const isMeetings =
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/dashboard/meetings");

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <AudioLines className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t("sidebar.brand")}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t("sidebar.tagline")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.workspace")}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t("sidebar.meetings")}
                isActive={isMeetings}
              >
                <Link to="/dashboard">
                  <ListTodo className="size-4" />
                  <span>{t("sidebar.meetings")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("sidebar.newRecording")}>
                <Link to="/dashboard#upload">
                  <CloudUpload className="size-4" />
                  <span>{t("sidebar.newRecording")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Dev</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("sidebar.jobs")}>
                <a href={`${API_URL}/queues`} target="_blank" rel="noreferrer">
                  <Waypoints className="size-4" />
                  <span>{t("sidebar.jobs")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("sidebar.apiDocs")}>
                <a href={`${API_URL}/api`} target="_blank" rel="noreferrer">
                  <BookOpen className="size-4" />
                  <span>{t("sidebar.apiDocs")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavAdmin isAdmin={isAdmin} currentPath={location.pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            email: user.data?.email || "",
            name: user.data?.name || "",
            avatar: user.data?.image || ""
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
