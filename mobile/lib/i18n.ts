import { getLocales } from "expo-localization";

type Dict = Record<string, string>;
type Locale = "de" | "en";

const strings: Record<Locale, Dict> = {
  de: {
    // App + shared
    "app.cancel": "Abbrechen",
    "app.save": "Speichern",
    "app.delete": "Löschen",
    "app.back": "Zurück",
    "app.confirm": "Bestätigen",
    "app.family": "Familie",
    "app.password": "Passwort",
    "app.email": "E-Mail",
    "app.emailPlaceholder": "eltern@familie.de",
    "app.loading": "…",

    // Tabs
    "tabs.missions": "Missionen",
    "tabs.progress": "Fortschritt",
    "tabs.rewards": "Belohnungen",
    "tabs.profile": "Profil",

    // Login
    "login.appTagline": "Missionen für die ganze Familie",
    "login.parentTab": "Eltern",
    "login.childTab": "Kind",
    "login.signIn": "Anmelden",
    "login.pin": "PIN",
    "login.childGo": "Los geht's",
    "login.whoAreYou": "Wer bist du?",
    "login.noAccount": "Noch kein Konto? ",
    "login.register": "Registrieren",
    "login.resetDevice": "Gerät zurücksetzen",
    "login.failed": "Anmeldung fehlgeschlagen",

    // Register
    "register.title": "Familie anlegen",
    "register.subtitle": "Erstelle dein LevelMission-Konto",
    "register.familyName": "Familienname",
    "register.familyNamePlaceholder": "Müller-Familie",
    "register.parentName": "Dein Name (optional)",
    "register.parentNamePlaceholder": "Dennis",
    "register.passwordLabel": "Passwort (mind. 8 Zeichen)",
    "register.adultConfirm":
      "Ich bestätige, dass ich mindestens 18 Jahre alt bin und ein Elternteil oder Erziehungsberechtigter bin.",
    "register.submit": "Registrieren",
    "register.haveAccount": "Bereits ein Konto? ",
    "register.failed": "Registrierung fehlgeschlagen",

    // Setup
    "setup.title": "Familie einrichten",
    "setup.subtitle":
      "Lege die Kinder und ersten Belohnungen an. Alles kann später geändert werden.",
    "setup.children": "Kinder",
    "setup.name": "Name",
    "setup.age": "Alter",
    "setup.remove": "Entfernen",
    "setup.addChild": "+ Weiteres Kind",
    "setup.rewardsOptional": "Belohnungen (optional)",
    "setup.rewardNamePlaceholder": "Name (z.B. 30 Min Bildschirmzeit)",
    "setup.rewardDescriptionPlaceholder": "Beschreibung (optional)",
    "setup.xpCost": "XP-Kosten",
    "setup.addReward": "+ Weitere Belohnung",
    "setup.submit": "Setup abschließen",
    "setup.needOneChild": "Bitte lege mindestens ein Kind an",
    "setup.failed": "Setup fehlgeschlagen",

    // Missions screen
    "missions.yourMissions": "Deine Missionen",
    "missions.forFamily": "Missionen für",
    "missions.empty": "Noch keine Missionen. Tippe auf „+\", um die erste anzulegen.",
    "missions.actionsPrompt": "Was möchtest du tun?",
    "missions.markDone": "Erledigt!",

    // Create mission modal
    "createMission.title": "Neue Mission",
    "createMission.submit": "Anlegen",
    "createMission.titleLabel": "Titel",
    "createMission.titlePlaceholder": "z.B. Zimmer aufräumen",
    "createMission.descriptionLabel": "Beschreibung (optional)",
    "createMission.xpLabel": "XP-Belohnung",
    "createMission.assignLabel": "Für wen?",
    "createMission.noChildren": "Keine Kinder angelegt.",
    "createMission.unassigned": "Alle / nicht zugewiesen",
    "createMission.error": "Fehler",

    // Rewards
    "rewards.empty": "Noch keine Belohnungen angelegt.",
    "rewards.deletePrompt": "Belohnung löschen?",

    // Create reward modal
    "createReward.title": "Neue Belohnung",
    "createReward.submit": "Anlegen",
    "createReward.nameLabel": "Name",
    "createReward.namePlaceholder": "z.B. Kinoabend",
    "createReward.descriptionLabel": "Beschreibung (optional)",
    "createReward.requiredXP": "Benötigte XP",

    // Progress
    "progress.title": "Fortschritt",
    "progress.yourChildren": "Deine Kinder",
    "progress.yourPoints": "Deine Punkte",
    "progress.xpEarned": "XP gesammelt",
    "progress.open": "Offen",
    "progress.done": "Erledigt",
    "progress.nextReward": "Nächste Belohnung",
    "progress.allRewardsReached": "Alle Belohnungen erreicht 🎉",
    "progress.unlocked": "Freigeschaltet ✓",

    // Profile
    "profile.title": "Profil",
    "profile.childIn": "Kind in",
    "profile.manageFamily": "Familie verwalten",
    "profile.manageFamilySubtitle": "Kinder, PINs und Einrichtung verwalten",
    "profile.privacy": "Datenschutz",
    "profile.terms": "Nutzungsbedingungen",
    "profile.openInBrowser": "Im Browser öffnen",
    "profile.signOut": "Abmelden",
    "profile.signOutPrompt": "Möchtest du dich wirklich abmelden?",
    "profile.deleteAccount": "Konto löschen",
    "profile.deleteAccountHint":
      "Alle Missionen, Belohnungen und Kinderprofile werden unwiderruflich entfernt.",
    "profile.deleteAccountConfirmTitle": "Konto endgültig löschen",
    "profile.deleteAccountConfirm": "Bitte bestätige mit deinem Passwort.",
    "profile.deleting": "Löscht…",
    "profile.deleteFailed": "Löschen fehlgeschlagen",
    "profile.parentalGateTitleDelete": "Nur Eltern dürfen das Konto löschen",
    "profile.parentalGateTitleAdult": "Nur für Erwachsene",

    // Family
    "family.childrenHeadline": "Kinder",
    "family.pinHint":
      "Setze einen 4- bis 6-stelligen PIN, damit sich ein Kind auf diesem Gerät anmelden kann.",
    "family.emptyChildren": "Noch keine Kinder angelegt.",
    "family.pinSet": "PIN gesetzt",
    "family.noPin": "Kein PIN",
    "family.setPin": "PIN setzen",
    "family.changePin": "PIN ändern",
    "family.removePin": "PIN entfernen",
    "family.removePinPrompt": "kann sich dann nicht mehr anmelden.",
    "family.pinFor": "PIN für",
    "family.pinDigits": "4–6 Ziffern",
    "family.unknownChild": "Kind",

    // Parental gate
    "parentalGate.prompt": "Bitte löse diese Aufgabe, um fortzufahren.",
    "parentalGate.wrong": "Falsch. Bitte versuche es erneut.",
  },
  en: {
    "app.cancel": "Cancel",
    "app.save": "Save",
    "app.delete": "Delete",
    "app.back": "Back",
    "app.confirm": "Confirm",
    "app.family": "Family",
    "app.password": "Password",
    "app.email": "Email",
    "app.emailPlaceholder": "parent@family.com",
    "app.loading": "…",

    "tabs.missions": "Missions",
    "tabs.progress": "Progress",
    "tabs.rewards": "Rewards",
    "tabs.profile": "Profile",

    "login.appTagline": "Missions for the whole family",
    "login.parentTab": "Parent",
    "login.childTab": "Kid",
    "login.signIn": "Sign in",
    "login.pin": "PIN",
    "login.childGo": "Let's go",
    "login.whoAreYou": "Who are you?",
    "login.noAccount": "No account yet? ",
    "login.register": "Sign up",
    "login.resetDevice": "Reset device",
    "login.failed": "Sign-in failed",

    "register.title": "Create family",
    "register.subtitle": "Create your LevelMission account",
    "register.familyName": "Family name",
    "register.familyNamePlaceholder": "Miller Family",
    "register.parentName": "Your name (optional)",
    "register.parentNamePlaceholder": "Alex",
    "register.passwordLabel": "Password (min. 8 characters)",
    "register.adultConfirm":
      "I confirm that I am at least 18 years old and a parent or legal guardian.",
    "register.submit": "Sign up",
    "register.haveAccount": "Already have an account? ",
    "register.failed": "Sign-up failed",

    "setup.title": "Set up family",
    "setup.subtitle":
      "Add children and the first rewards. Everything can be changed later.",
    "setup.children": "Children",
    "setup.name": "Name",
    "setup.age": "Age",
    "setup.remove": "Remove",
    "setup.addChild": "+ Another child",
    "setup.rewardsOptional": "Rewards (optional)",
    "setup.rewardNamePlaceholder": "Name (e.g. 30 min screen time)",
    "setup.rewardDescriptionPlaceholder": "Description (optional)",
    "setup.xpCost": "XP cost",
    "setup.addReward": "+ Another reward",
    "setup.submit": "Finish setup",
    "setup.needOneChild": "Please add at least one child",
    "setup.failed": "Setup failed",

    "missions.yourMissions": "Your missions",
    "missions.forFamily": "Missions for",
    "missions.empty": "No missions yet. Tap „+\" to add one.",
    "missions.actionsPrompt": "What would you like to do?",
    "missions.markDone": "Done!",

    "createMission.title": "New mission",
    "createMission.submit": "Create",
    "createMission.titleLabel": "Title",
    "createMission.titlePlaceholder": "e.g. tidy the room",
    "createMission.descriptionLabel": "Description (optional)",
    "createMission.xpLabel": "XP reward",
    "createMission.assignLabel": "For whom?",
    "createMission.noChildren": "No children added.",
    "createMission.unassigned": "Anyone / unassigned",
    "createMission.error": "Error",

    "rewards.empty": "No rewards added yet.",
    "rewards.deletePrompt": "Delete reward?",

    "createReward.title": "New reward",
    "createReward.submit": "Create",
    "createReward.nameLabel": "Name",
    "createReward.namePlaceholder": "e.g. movie night",
    "createReward.descriptionLabel": "Description (optional)",
    "createReward.requiredXP": "Required XP",

    "progress.title": "Progress",
    "progress.yourChildren": "Your children",
    "progress.yourPoints": "Your points",
    "progress.xpEarned": "XP earned",
    "progress.open": "Open",
    "progress.done": "Done",
    "progress.nextReward": "Next reward",
    "progress.allRewardsReached": "All rewards unlocked 🎉",
    "progress.unlocked": "Unlocked ✓",

    "profile.title": "Profile",
    "profile.childIn": "Child in",
    "profile.manageFamily": "Manage family",
    "profile.manageFamilySubtitle": "Children, PINs and setup",
    "profile.privacy": "Privacy",
    "profile.terms": "Terms of use",
    "profile.openInBrowser": "Open in browser",
    "profile.signOut": "Sign out",
    "profile.signOutPrompt": "Are you sure you want to sign out?",
    "profile.deleteAccount": "Delete account",
    "profile.deleteAccountHint":
      "All missions, rewards and child profiles will be removed permanently.",
    "profile.deleteAccountConfirmTitle": "Permanently delete account",
    "profile.deleteAccountConfirm": "Please confirm with your password.",
    "profile.deleting": "Deleting…",
    "profile.deleteFailed": "Deletion failed",
    "profile.parentalGateTitleDelete": "Only parents may delete the account",
    "profile.parentalGateTitleAdult": "Adults only",

    "family.childrenHeadline": "Children",
    "family.pinHint":
      "Set a 4- to 6-digit PIN so a child can sign in on this device.",
    "family.emptyChildren": "No children added yet.",
    "family.pinSet": "PIN set",
    "family.noPin": "No PIN",
    "family.setPin": "Set PIN",
    "family.changePin": "Change PIN",
    "family.removePin": "Remove PIN",
    "family.removePinPrompt": "will no longer be able to sign in.",
    "family.pinFor": "PIN for",
    "family.pinDigits": "4–6 digits",
    "family.unknownChild": "Child",

    "parentalGate.prompt": "Please solve this to continue.",
    "parentalGate.wrong": "Wrong. Please try again.",
  },
};

export type TKey = keyof (typeof strings)["de"];

const deviceLocale = (() => {
  const tag = getLocales()[0]?.languageCode?.toLowerCase() ?? "de";
  return tag === "en" ? "en" : "de";
})();

export function t(key: TKey): string {
  return strings[deviceLocale][key] ?? strings.de[key] ?? key;
}

export const currentLocale: Locale = deviceLocale;
