import Swal from "sweetalert2";

export const showAlert = {
  success: (title: string, message?: string) => {
    return Swal.fire({
      icon: "success",
      title,
      text: message,
      timer: 2500,
      showConfirmButton: true,
      confirmButtonColor: "#0000F2",
      background: "#ffffff",
      color: "#0f172a",
      customClass: {
        popup: "rounded-xl shadow-2xl border border-slate-100",
        confirmButton: "px-5 py-2 rounded-lg font-medium text-white shadow-sm",
      },
    });
  },

  error: (title: string, message?: string) => {
    return Swal.fire({
      icon: "error",
      title,
      text: message || "Something went wrong. Please try again.",
      confirmButtonColor: "#ef4444",
      background: "#ffffff",
      color: "#0f172a",
      customClass: {
        popup: "rounded-xl shadow-2xl border border-slate-100",
        confirmButton: "px-5 py-2 rounded-lg font-medium text-white shadow-sm",
      },
    });
  },

  warning: (title: string, message?: string) => {
    return Swal.fire({
      icon: "warning",
      title,
      text: message,
      confirmButtonColor: "#f59e0b",
      background: "#ffffff",
      color: "#0f172a",
      customClass: {
        popup: "rounded-xl shadow-2xl border border-slate-100",
        confirmButton: "px-5 py-2 rounded-lg font-medium text-white shadow-sm",
      },
    });
  },

  confirm: async (title: string, text: string, confirmButtonText = "Confirm") => {
    const result = await Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0000F2",
      cancelButtonColor: "#64748b",
      confirmButtonText,
      cancelButtonText: "Cancel",
      background: "#ffffff",
      color: "#0f172a",
      customClass: {
        popup: "rounded-xl shadow-2xl border border-slate-100",
        confirmButton: "px-5 py-2 rounded-lg font-medium text-white shadow-sm",
        cancelButton: "px-5 py-2 rounded-lg font-medium text-white shadow-sm",
      },
    });
    return result.isConfirmed;
  },
};
