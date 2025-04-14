import React, { createContext, useContext, useState } from 'react';

const MesaContext = createContext();

export function MesaProvider({ children }) {
  const [mesa, setMesa] = useState(null);
  return (
    <MesaContext.Provider value={{ mesa, setMesa }}>
      {children}
    </MesaContext.Provider>
  );
}

export function useMesa() {
  return useContext(MesaContext);
}
