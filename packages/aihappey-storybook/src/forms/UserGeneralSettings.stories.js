import React, { useState } from "react";
import { UserGeneralSettings } from "aihappey-components";

export default {
  title: "Forms/UserGeneralSettings",
  component: UserGeneralSettings,
};

const Wrapper = (props) => {
  const [lang, setLang] = useState(props.language || "en");
  const languages = ["en", "nl"]
  return React.createElement(UserGeneralSettings, {
    ...props,
    language: lang,
    languages,
    onLanguageChange: setLang,
    onDeleteAllChats: () => alert("Delete all chats clicked"),
    onLogout: () => alert("Logout clicked"),
  });
};

export const Default = () =>
  React.createElement(Wrapper, {});

export const Dutch = () =>
  React.createElement(Wrapper, {
    language: "nl",
  });
