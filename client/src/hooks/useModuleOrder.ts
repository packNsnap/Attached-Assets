import { useState, useEffect, useCallback } from "react";
import { MODULES } from "@/lib/constants";

const STORAGE_KEY = "sidebar-module-order";

export type ModuleType = typeof MODULES[number];

export function useModuleOrder() {
  const [orderedModules, setOrderedModules] = useState<ModuleType[]>(MODULES);

  useEffect(() => {
    const savedOrder = localStorage.getItem(STORAGE_KEY);
    if (savedOrder) {
      try {
        const savedPaths: string[] = JSON.parse(savedOrder);
        const reordered = savedPaths
          .map(path => MODULES.find(m => m.path === path))
          .filter((m): m is ModuleType => m !== undefined);
        
        const missingModules = MODULES.filter(
          m => !savedPaths.includes(m.path)
        );
        
        setOrderedModules([...reordered, ...missingModules]);
      } catch (e) {
        setOrderedModules(MODULES);
      }
    }
  }, []);

  const reorderModules = useCallback((fromIndex: number, toIndex: number) => {
    setOrderedModules(prev => {
      const newOrder = [...prev];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder.map(m => m.path)));
      
      return newOrder;
    });
  }, []);

  const resetOrder = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOrderedModules(MODULES);
  }, []);

  return { orderedModules, reorderModules, resetOrder };
}
