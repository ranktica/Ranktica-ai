import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from 'i18next';
import { initReactI18next, useTranslation as useReactI18next } from 'react-i18next';

export type LanguageCode = 'en' | 'es' | 'fr';

export interface Translations {
  [key: string]: {
    en: string;
    es: string;
    fr: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation & Core Labels
  creatorCommand: {
    en: "Creator Command",
    es: "Comando de Creador",
    fr: "Commandement du Créateur"
  },
  productionBoard: {
    en: "Production Board",
    es: "Tablero de Producción",
    fr: "Tableau de Production"
  },
  teamMembers: {
    en: "Team Members",
    es: "Miembros del Equipo",
    fr: "Membres de l'Équipe"
  },
  videoStudio: {
    en: "Video Studio",
    es: "Estudio de Video",
    fr: "Studio Vidéo"
  },
  digitalEmployeeOS: {
    en: "Digital Employee OS",
    es: "SO de Empleado Digital",
    fr: "OS d'Employé Numérique"
  },
  auditCompliance: {
    en: "Audit & Compliance",
    es: "Auditoría y Cumplimiento",
    fr: "Audit et Conformité"
  },
  systemManifest: {
    en: "System Manifest",
    es: "Manifiesto del Sistema",
    fr: "Manifeste du Système"
  },
  aiCostGovernance: {
    en: "AI Cost Governance",
    es: "Gobernanza de Costos de IA",
    fr: "Gouvernance des Coûts de l'IA"
  },
  securityAuditing: {
    en: "Security & Auditing",
    es: "Seguridad y Auditoría",
    fr: "Sécurité et Audit"
  },
  
  // Interface headers
  inviteCollaborator: {
    en: "Invite Collaborator",
    es: "Invitar Colaborador",
    fr: "Inviter un Collaborateur"
  },
  exportPdf: {
    en: "Export PDF",
    es: "Exportar PDF",
    fr: "Exporter en PDF"
  },
  searchPlaceholder: {
    en: "Search members by name or email...",
    es: "Buscar miembros por nombre o correo...",
    fr: "Rechercher des membres par nom ou e-mail..."
  },
  
  // Form fields & Buttons
  nameLabel: {
    en: "Full Name",
    es: "Nombre Completo",
    fr: "Nom Complet"
  },
  emailLabel: {
    en: "Email Address",
    es: "Dirección de Correo",
    fr: "Adresse E-mail"
  },
  roleLabel: {
    en: "Project Permission Role",
    es: "Rol de Permiso de Proyecto",
    fr: "Rôle d'Autorisation de Projet"
  },
  projectLabel: {
    en: "Scope (Specific Project)",
    es: "Alcance (Proyecto Específico)",
    fr: "Portée (Projet Spécifique)"
  },
  btnInvite: {
    en: "Send Invitation",
    es: "Enviar Invitación",
    fr: "Envoyer l'Invitation"
  },
  btnCancel: {
    en: "Cancel",
    es: "Cancelar",
    fr: "Annuler"
  },
  btnDelete: {
    en: "Delete",
    es: "Eliminar",
    fr: "Supprimer"
  },
  btnSave: {
    en: "Save Changes",
    es: "Guardar Cambios",
    fr: "Enregistrer les Modifications"
  },
  confirmTitle: {
    en: "Are you sure?",
    es: "¿Está seguro?",
    fr: "Êtes-vous sûr ?"
  },
  confirmDeleteMsg: {
    en: "This action will permanently revoke access for this collaborator.",
    es: "Esta acción revocará permanentemente el acceso de este colaborador.",
    fr: "Cette action révoquera définitivement l'accès de ce collaborateur."
  },
  
  // Statuses
  active: {
    en: "Active",
    es: "Activo",
    fr: "Actif"
  },
  invited: {
    en: "Invited",
    es: "Invitado",
    fr: "Invité"
  },
  
  // Roles
  viewer: {
    en: "Viewer",
    es: "Lector",
    fr: "Lecteur"
  },
  editor: {
    en: "Editor",
    es: "Editor",
    fr: "Éditeur"
  },
  admin: {
    en: "Admin",
    es: "Administrador",
    fr: "Administrateur"
  },

  // Calendar translation
  calendarSync: {
    en: "Google Calendar Synchronization",
    es: "Sincronización de Google Calendar",
    fr: "Synchronisation de Google Calendar"
  },
  syncSuccess: {
    en: "Successfully synchronized event to Google Calendar!",
    es: "¡Sincronizado con éxito en Google Calendar!",
    fr: "Synchronisation réussie sur Google Calendar !"
  }
};

// Map original structured dictionary into standard i18next resource format
const resources: Record<LanguageCode, { translation: Record<string, string> }> = {
  en: { translation: {} },
  es: { translation: {} },
  fr: { translation: {} }
};

Object.entries(TRANSLATIONS).forEach(([key, value]) => {
  resources.en.translation[key] = value.en;
  resources.es.translation[key] = value.es;
  resources.fr.translation[key] = value.fr;
});

const savedLanguage = (localStorage.getItem('ranktica_active_language') as LanguageCode) || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n: i18nInstance } = useReactI18next();
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    return (i18nInstance.language as LanguageCode) || 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('ranktica_active_language', lang);
    document.documentElement.lang = lang;
    i18nInstance.changeLanguage(lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return i18nInstance.t(key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
