import { useState } from "react";
import Navbar from "../Navbar";

export default function NavbarExample() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <Navbar 
      isDarkMode={isDarkMode} 
      onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
    />
  );
}
