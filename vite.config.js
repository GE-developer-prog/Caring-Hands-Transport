import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'about.html',
        services: 'services.html',
        jobs: 'jobs.html',
        contact: 'contact.html',
        employeeReferral: 'employee-referral.html',
        vehicleMaintenance: 'vehicle-maintenance.html',
        employeesOnly: 'employees-only.html',
        staffLogin: 'staff-login.html',
        staffPortal: 'staff-portal.html',
        feedback: 'feedback.html',
        requestTransportation: 'request-transportation.html',
        employmentApplication: 'employment-application.html',
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
});