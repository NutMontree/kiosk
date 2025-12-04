"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// กำหนด Type ของข้อมูลที่เราจะแชร์ทั้งแอพ
interface KioskContextType {
  activeTab: "DASHBOARD" | "TEACHER" | "STUDENT";
  setActiveTab: (tab: "DASHBOARD" | "TEACHER" | "STUDENT") => void;
  isAdmin: boolean;
  setIsAdmin: (status: boolean) => void;
  currentUser: string;
  setCurrentUser: (user: string) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export function KioskProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<
    "DASHBOARD" | "TEACHER" | "STUDENT"
  >("DASHBOARD");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <KioskContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAdmin,
        setIsAdmin,
        currentUser,
        setCurrentUser,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </KioskContext.Provider>
  );
}

// Custom Hook เพื่อเรียกใช้ข้อมูลง่ายๆ
export function useKiosk() {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error("useKiosk must be used within a KioskProvider");
  }
  return context;
}
