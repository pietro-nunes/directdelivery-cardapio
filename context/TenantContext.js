import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TenantContext = createContext();

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [tenantData, setTenantData] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem("tenant").then((tenant) => {
      if (tenant) setTenant(tenant);
    });

    AsyncStorage.getItem("tenantId").then((tenantId) => {
      if (tenantId) setTenantId(tenantId);
    });
  }, []);

  const saveTenant = async (tenant) => {
    await AsyncStorage.setItem("tenant", tenant);
    setTenant(tenant);
  };

  const saveTenantId = async (tenantId) => {
    await AsyncStorage.setItem("tenantId", tenantId);
    setTenantId(tenantId);
  };

  return (
    <TenantContext.Provider value={{ tenant, saveTenant, tenantData, setTenantData, saveTenantId, tenantId}}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
