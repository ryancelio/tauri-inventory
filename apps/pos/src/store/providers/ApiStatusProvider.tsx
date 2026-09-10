// import { PropsWithChildren, useEffect } from "react";
// import { ApiStatusCheck } from "../../context/contexts";
// import { useApiStatusStore } from "../apiStatus";
// import { listen } from "@tauri-apps/api/event";

// export default function ApiStatusProvider({
//   children,
//   initialStatus,
// }: PropsWithChildren<{ initialStatus: ApiStatusCheck }>) {
//   const setOnline = useApiStatusStore((s) => s.setOnline);
//   const setChecking = useApiStatusStore((s) => s.setChecking);

//   useEffect(() => {
//     setOnline(initialStatus.isOnline);
//     setChecking(initialStatus.isChecking);
//   }, []);

//   useEffect(() => {
//     let unlistenOnline: (() => void) | undefined;
//     let unlistenChecking: (() => void) | undefined;

//     async function setup() {
//       unlistenChecking = await listen<boolean>(
//         "checking-api-connection",
//         (event) => {
//           setChecking(event.payload);
//         },
//       );

//       unlistenOnline = await listen<boolean>("api-online", (event) => {
//         setOnline(event.payload);
//       });
//     }

//     setup();

//     return () => {
//       unlistenOnline?.();
//       unlistenChecking?.();
//     };
//   }, []);

//   return children;
// }
