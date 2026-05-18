import { createBrowserRouter } from "react-router";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import MatchesPage from "./components/MatchesPage";
import LeagueStandings from "./components/LeagueStandings";
import MatchDetail from "./components/MatchDetail";
import AdminPanel from "./components/AdminPanel";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/matches",
    Component: MatchesPage,
  },
  {
    path: "/league/:leagueId",
    Component: LeagueStandings,
  },
  {
    path: "/match/:matchId",
    Component: MatchDetail,
  },
  {
    path: "/admin",
    Component: AdminPanel,
  },
]);
