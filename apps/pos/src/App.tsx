import { useEffect, useState } from "react";
import React from "react";
import ToastProvider from "./context/Toast/ToastContext";
import { checkApiStatus, checkUpdate, UpdateMetadata } from "./backend/backendHelper";
import AppUpdateModal from "./Routes/Routers/Init/AppUpdateModal";

export default function App({ children }: React.PropsWithChildren) {

  const [updateModal,setUpdateModal] = useState<UpdateMetadata | null>(null)

  useEffect(() => {
    const initialChecks = async () => {
      try{
        await checkApiStatus();
        // -- Has connection to API
        const update = await checkUpdate();
        if(update){
          setUpdateModal(update);
        }
      }catch(e){
        console.error(e)
      }
    };
    
    initialChecks();
  }, []);

  return (
    <main
      className="isolate"
      // onContextMenu={(e) => e.preventDefault()}
    >
      <ToastProvider>
        { updateModal !== null &&
          <AppUpdateModal onClose={() => setUpdateModal(null)} update={updateModal} />
        }
        {children}
        </ToastProvider>
    </main>
  );
}
