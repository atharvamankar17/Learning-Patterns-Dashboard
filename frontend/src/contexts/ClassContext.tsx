import React, { createContext, useContext, useState, ReactNode } from "react";

interface ClassContextType {
    selectedClass: string;
    setSelectedClass: (cls: string) => void;
    availableClasses: string[];
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export function ClassProvider({ children }: { children: ReactNode }) {
    const [selectedClass, setSelectedClass] = useState<string>("School");

    // Fake deterministic classes from backend
    const availableClasses = ["School", "10-A", "10-B", "10-C"];

    return (
        <ClassContext.Provider value={{ selectedClass, setSelectedClass, availableClasses }}>
            {children}
        </ClassContext.Provider>
    );
}

export function useClassSelection() {
    const context = useContext(ClassContext);
    if (context === undefined) {
        throw new Error("useClassSelection must be used within a ClassProvider");
    }
    return context;
}
