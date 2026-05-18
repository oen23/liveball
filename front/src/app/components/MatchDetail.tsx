import { useParams, useNavigate } from "react-router";
import {
  Play, ChevronLeft, MapPin, Clock, Users, Calendar,
  Activity, List, Info, ChevronRight, Shield,
  Zap, Target, Flag,
} from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
import CountdownTimer from "./CountdownTimer";

interface StoredMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  stadium: string;
  startTime: string;
  isLive: boolean;
  viewers: number;
  isMainMatch: boolean;
  homeScore?: number;
  awayScore?: number;
  possession?: { home: number; away: number };
  shots?: { home: number; away: number };
}

const SEED_MATCHES: StoredMatch[] = [
  { id: 1,  homeTeam: "Manchester United", awayTeam: "Liverpool",         league: "Premier League",         stadium: "Old Trafford",         startTime: new Date(Date.now() + 2.0 * 3600_000).toISOString(), isLive: false, viewers: 45230, isMainMatch: true  },
  { id: 2,  homeTeam: "Barcelona",         awayTeam: "Real Madrid",        league: "La Liga",                stadium: "Camp Nou",              startTime: new Date(Date.now() + 3.5 * 3600_000).toISOString(), isLive: true,  viewers: 38420, isMainMatch: false, homeScore: 1, awayScore: 2, possession: { home: 48, away: 52 }, shots: { home: 7,  away: 11 } },
  { id: 3,  homeTeam: "Bayern Munich",     awayTeam: "Borussia Dortmund",  league: "Bundesliga",             stadium: "Allianz Arena",         startTime: new Date(Date.now() + 5.0 * 3600_000).toISOString(), isLive: false, viewers: 29150, isMainMatch: false },
  { id: 4,  homeTeam: "PSG",               awayTeam: "Marseille",          league: "Ligue 1",                stadium: "Parc des Princes",      startTime: new Date(Date.now() + 1.5 * 3600_000).toISOString(), isLive: true,  viewers: 22340, isMainMatch: false, homeScore: 0, awayScore: 0, possession: { home: 61, away: 39 }, shots: { home: 4,  away: 2  } },
  { id: 5,  homeTeam: "Juventus",          awayTeam: "Inter Milan",        league: "Serie A",                stadium: "Allianz Stadium",       startTime: new Date(Date.now() + 4.0 * 3600_000).toISOString(), isLive: false, viewers: 31200, isMainMatch: false },
  { id: 6,  homeTeam: "Real Madrid",       awayTeam: "Man City",           league: "UEFA Champions League",  stadium: "Santiago Bernabéu",     startTime: new Date(Date.now() + 6.0 * 3600_000).toISOString(), isLive: false, viewers: 52800, isMainMatch: false },
  { id: 7,  homeTeam: "Arsenal",           awayTeam: "Chelsea",            league: "Premier League",         stadium: "Emirates Stadium",      startTime: new Date(Date.now() + 0.5 * 3600_000).toISOString(), isLive: true,  viewers: 40100, isMainMatch: false, homeScore: 2, awayScore: 1, possession: { home: 55, away: 45 }, shots: { home: 9,  away: 6  } },
  { id: 8,  homeTeam: "Atletico Madrid",   awayTeam: "Sevilla",            league: "La Liga",                stadium: "Wanda Metropolitano",   startTime: new Date(Date.now() + 7.0 * 3600_000).toISOString(), isLive: false, viewers: 18500, isMainMatch: false },
  { id: 9,  homeTeam: "AC Milan",          awayTeam: "Napoli",             league: "Serie A",                stadium: "San Siro",              startTime: new Date(Date.now() + 3.0 * 3600_000).toISOString(), isLive: false, viewers: 25700, isMainMatch: false },
  { id: 10, homeTeam: "Fiorentina",        awayTeam: "Olympiacos",         league: "UEFA Conference League", stadium: "Artemio Franchi",       startTime: new Date(Date.now() + 2.5 * 3600_000).toISOString(), isLive: false, viewers: 12400, isMainMatch: false },
  { id: 11, homeTeam: "Bayer Leverkusen",  awayTeam: "RB Leipzig",         league: "Bundesliga",             stadium: "BayArena",              startTime: new Date(Date.now() + 4.5 * 3600_000).toISOString(), isLive: false, viewers: 19800, isMainMatch: false },
  { id: 12, homeTeam: "Monaco",            awayTeam: "Lyon",               league: "Ligue 1",                stadium: "Stade Louis II",        startTime: new Date(Date.now() + 8.0 * 3600_000).toISOString(), isLive: false, viewers: 14200, isMainMatch: false },
  { id: 13, homeTeam: "Barcelona",         awayTeam: "Benfica",            league: "UEFA Champions League",  stadium: "Camp Nou",              startTime: new Date(Date.now() + 9.0 * 3600_000).toISOString(), isLive: false, viewers: 47300, isMainMatch: false },
];

// ─── Local types ──────────────────────────────────────────────────────────────

interface Player { number: number; name: string; position: string; }

interface MatchEvent {
  minute: number;
  type: "goal" | "yellow" | "red" | "sub" | "var";
  team: "home" | "away";
  player: string;
  detail?: string;
}

type Tab = "overview" | "lineups" | "stats";

// ─── Составы ──────────────────────────────────────────────────────────────────
// ВРЕМЕННО захардкожено. После подключения FastAPI — удали весь объект LINEUPS.
// Составы будут приходить в поле lineups внутри ответа GET /api/matches/{id}
// Модели в PostgreSQL: Player (id, name, number, position, country, photo_url)
//                      MatchLineup (match_id, player_id, team: "home"|"away")

const LINEUPS: Record<number, { home: Player[]; away: Player[] }> = {
  1: {
    home: [
      { number: 1, name: "André Onana", position: "GK" },
      { number: 2, name: "Victor Lindelöf", position: "RB" },
      { number: 5, name: "Harry Maguire", position: "CB" },
      { number: 6, name: "Lisandro Martínez", position: "CB" },
      { number: 23, name: "Luke Shaw", position: "LB" },
      { number: 8, name: "Casemiro", position: "CDM" },
      { number: 14, name: "Christian Eriksen", position: "CM" },
      { number: 18, name: "Bruno Fernandes", position: "CAM" },
      { number: 21, name: "Antony", position: "RW" },
      { number: 10, name: "Marcus Rashford", position: "LW" },
      { number: 11, name: "Rasmus Højlund", position: "ST" },
    ],
    away: [
      { number: 1, name: "Alisson Becker", position: "GK" },
      { number: 66, name: "Trent Alexander-Arnold", position: "RB" },
      { number: 5, name: "Ibrahima Konaté", position: "CB" },
      { number: 4, name: "Virgil van Dijk", position: "CB" },
      { number: 26, name: "Andrew Robertson", position: "LB" },
      { number: 3, name: "Wataru Endo", position: "CDM" },
      { number: 8, name: "Dominik Szoboszlai", position: "CM" },
      { number: 14, name: "Ryan Gravenberch", position: "CM" },
      { number: 11, name: "Mohamed Salah", position: "RW" },
      { number: 27, name: "Darwin Núñez", position: "ST" },
      { number: 7, name: "Luis Díaz", position: "LW" },
    ],
  },
  2: {
    home: [
      { number: 1, name: "Marc-André ter Stegen", position: "GK" },
      { number: 23, name: "Jules Koundé", position: "RB" },
      { number: 4, name: "Ronald Araújo", position: "CB" },
      { number: 15, name: "Andreas Christensen", position: "CB" },
      { number: 3, name: "Alejandro Baldé", position: "LB" },
      { number: 5, name: "Sergio Busquets", position: "CDM" },
      { number: 21, name: "Frenkie de Jong", position: "CM" },
      { number: 8, name: "Pedri", position: "CM" },
      { number: 11, name: "Raphinha", position: "RW" },
      { number: 9, name: "Robert Lewandowski", position: "ST" },
      { number: 7, name: "Ferran Torres", position: "LW" },
    ],
    away: [
      { number: 1, name: "Thibaut Courtois", position: "GK" },
      { number: 2, name: "Dani Carvajal", position: "RB" },
      { number: 3, name: "Éder Militão", position: "CB" },
      { number: 4, name: "David Alaba", position: "CB" },
      { number: 23, name: "Ferland Mendy", position: "LB" },
      { number: 10, name: "Luka Modrić", position: "CM" },
      { number: 8, name: "Toni Kroos", position: "CM" },
      { number: 15, name: "Federico Valverde", position: "CDM" },
      { number: 14, name: "Joselu", position: "RW" },
      { number: 9, name: "Jude Bellingham", position: "CAM" },
      { number: 20, name: "Vinícius Júnior", position: "LW" },
    ],
  },
  3: {
    home: [
      { number: 1, name: "Manuel Neuer", position: "GK" },
      { number: 5, name: "Benjamin Pavard", position: "RB" },
      { number: 2, name: "Dayot Upamecano", position: "CB" },
      { number: 4, name: "Matthijs de Ligt", position: "CB" },
      { number: 19, name: "Alphonso Davies", position: "LB" },
      { number: 6, name: "Joshua Kimmich", position: "CDM" },
      { number: 8, name: "Leon Goretzka", position: "CM" },
      { number: 42, name: "Jamal Musiala", position: "CAM" },
      { number: 10, name: "Leroy Sané", position: "RW" },
      { number: 25, name: "Thomas Müller", position: "LW" },
      { number: 9, name: "Harry Kane", position: "ST" },
    ],
    away: [
      { number: 35, name: "Gregor Kobel", position: "GK" },
      { number: 26, name: "Julian Ryerson", position: "RB" },
      { number: 4, name: "Nico Schlotterbeck", position: "CB" },
      { number: 15, name: "Mats Hummels", position: "CB" },
      { number: 13, name: "Raphaël Guerreiro", position: "LB" },
      { number: 23, name: "Emre Can", position: "CDM" },
      { number: 22, name: "Marco Reus", position: "CM" },
      { number: 19, name: "Julian Brandt", position: "CAM" },
      { number: 16, name: "Karim Adeyemi", position: "RW" },
      { number: 43, name: "Jamie Bynoe-Gittens", position: "LW" },
      { number: 18, name: "Sébastien Haller", position: "ST" },
    ],
  },
  4: {
    home: [
      { number: 99, name: "Gianluigi Donnarumma", position: "GK" },
      { number: 2, name: "Achraf Hakimi", position: "RB" },
      { number: 3, name: "Presnel Kimpembe", position: "CB" },
      { number: 5, name: "Marquinhos", position: "CB" },
      { number: 25, name: "Nuno Mendes", position: "LB" },
      { number: 8, name: "Fabian Ruiz", position: "CM" },
      { number: 17, name: "Vitinha", position: "CM" },
      { number: 33, name: "Warren Zaïre-Emery", position: "CM" },
      { number: 7, name: "Kylian Mbappé", position: "LW" },
      { number: 10, name: "Ousmane Dembélé", position: "CAM" },
      { number: 11, name: "Bradley Barcola", position: "RW" },
    ],
    away: [
      { number: 16, name: "Pau López", position: "GK" },
      { number: 5, name: "Leonardo Balerdi", position: "CB" },
      { number: 99, name: "Chancel Mbemba", position: "CB" },
      { number: 3, name: "Éric Bailly", position: "CB" },
      { number: 7, name: "Jonathan Clauss", position: "RWB" },
      { number: 29, name: "Nuno Tavares", position: "LWB" },
      { number: 6, name: "Mattéo Guendouzi", position: "CM" },
      { number: 27, name: "Jordan Veretout", position: "CM" },
      { number: 10, name: "Vitaly Janelt", position: "CAM" },
      { number: 9, name: "Pierre-Emerick Aubameyang", position: "ST" },
      { number: 70, name: "Alexis Sánchez", position: "ST" },
    ],
  },
  5: {
    home: [
      { number: 1, name: "Wojciech Szczęsny", position: "GK" },
      { number: 6, name: "Danilo", position: "RB" },
      { number: 3, name: "Bremer", position: "CB" },
      { number: 19, name: "Leonardo Bonucci", position: "CB" },
      { number: 12, name: "Alex Sandro", position: "LB" },
      { number: 5, name: "Manuel Locatelli", position: "CDM" },
      { number: 25, name: "Adrien Rabiot", position: "CM" },
      { number: 20, name: "Fabio Miretti", position: "CM" },
      { number: 11, name: "Juan Cuadrado", position: "RW" },
      { number: 9, name: "Dušan Vlahović", position: "ST" },
      { number: 14, name: "Arkadiusz Milik", position: "LW" },
    ],
    away: [
      { number: 1, name: "André Onana", position: "GK" },
      { number: 36, name: "Matteo Darmian", position: "RB" },
      { number: 6, name: "Stefan de Vrij", position: "CB" },
      { number: 95, name: "Alessandro Bastoni", position: "CB" },
      { number: 32, name: "Federico Dimarco", position: "LB" },
      { number: 23, name: "Nicolò Barella", position: "CM" },
      { number: 20, name: "Hakan Çalhanoğlu", position: "CDM" },
      { number: 22, name: "Henrikh Mkhitaryan", position: "CM" },
      { number: 10, name: "Lautaro Martínez", position: "CAM" },
      { number: 9, name: "Marcus Thuram", position: "ST" },
      { number: 8, name: "Alexis Sánchez", position: "LW" },
    ],
  },
  6: {
    home: [
      { number: 1, name: "Andriy Lunin", position: "GK" },
      { number: 2, name: "Dani Carvajal", position: "RB" },
      { number: 3, name: "Éder Militão", position: "CB" },
      { number: 4, name: "David Alaba", position: "CB" },
      { number: 23, name: "Ferland Mendy", position: "LB" },
      { number: 10, name: "Luka Modrić", position: "CM" },
      { number: 8, name: "Toni Kroos", position: "CM" },
      { number: 15, name: "Federico Valverde", position: "CDM" },
      { number: 14, name: "Joselu", position: "RW" },
      { number: 9, name: "Jude Bellingham", position: "CAM" },
      { number: 20, name: "Vinícius Júnior", position: "LW" },
    ],
    away: [
      { number: 31, name: "Ederson", position: "GK" },
      { number: 2, name: "Kyle Walker", position: "RB" },
      { number: 3, name: "Rúben Dias", position: "CB" },
      { number: 14, name: "Aymeric Laporte", position: "CB" },
      { number: 6, name: "Joško Gvardiol", position: "LB" },
      { number: 16, name: "Rodri", position: "CDM" },
      { number: 8, name: "Ilkay Gündoğan", position: "CM" },
      { number: 20, name: "Bernardo Silva", position: "CM" },
      { number: 26, name: "Riyad Mahrez", position: "RW" },
      { number: 9, name: "Erling Haaland", position: "ST" },
      { number: 47, name: "Phil Foden", position: "LW" },
    ],
  },
  7: {
    home: [
      { number: 1, name: "David Raya", position: "GK" },
      { number: 4, name: "Ben White", position: "RB" },
      { number: 6, name: "Gabriel Magalhães", position: "CB" },
      { number: 12, name: "William Saliba", position: "CB" },
      { number: 35, name: "Oleksandr Zinchenko", position: "LB" },
      { number: 29, name: "Kai Havertz", position: "CDM" },
      { number: 8, name: "Martin Ødegaard", position: "CM" },
      { number: 41, name: "Declan Rice", position: "CM" },
      { number: 7, name: "Bukayo Saka", position: "RW" },
      { number: 9, name: "Gabriel Jesus", position: "ST" },
      { number: 11, name: "Leandro Trossard", position: "LW" },
    ],
    away: [
      { number: 1, name: "Robert Sánchez", position: "GK" },
      { number: 4, name: "Reece James", position: "RB" },
      { number: 26, name: "Trevoh Chalobah", position: "CB" },
      { number: 2, name: "Axel Disasi", position: "CB" },
      { number: 21, name: "Ben Chilwell", position: "LB" },
      { number: 5, name: "Moises Caicedo", position: "CDM" },
      { number: 8, name: "Enzo Fernández", position: "CM" },
      { number: 23, name: "Conor Gallagher", position: "CM" },
      { number: 20, name: "Raheem Sterling", position: "RW" },
      { number: 9, name: "Nicolas Jackson", position: "ST" },
      { number: 11, name: "Noni Madueke", position: "LW" },
    ],
  },
  8: {
    home: [
      { number: 13, name: "Jan Oblak", position: "GK" },
      { number: 16, name: "Nahuel Molina", position: "RB" },
      { number: 2, name: "José María Giménez", position: "CB" },
      { number: 4, name: "Mario Hermoso", position: "CB" },
      { number: 18, name: "Javi Galán", position: "LB" },
      { number: 5, name: "Rodrigo de Paul", position: "CM" },
      { number: 14, name: "Marcos Llorente", position: "CM" },
      { number: 6, name: "Koke", position: "CDM" },
      { number: 21, name: "Pablo Barrios", position: "CAM" },
      { number: 7, name: "Antoine Griezmann", position: "SS" },
      { number: 9, name: "Álvaro Morata", position: "ST" },
    ],
    away: [
      { number: 13, name: "Yassine Bounou", position: "GK" },
      { number: 2, name: "Jesús Navas", position: "RB" },
      { number: 4, name: "Loïc Badé", position: "CB" },
      { number: 5, name: "Marcos Acuña", position: "CB" },
      { number: 18, name: "Alejandro Acuña", position: "LB" },
      { number: 6, name: "Joan Jordán", position: "CDM" },
      { number: 8, name: "Lucas Ocampos", position: "CM" },
      { number: 10, name: "Isco", position: "CAM" },
      { number: 7, name: "Nemanja Gudelj", position: "CM" },
      { number: 11, name: "Rafa Mir", position: "LW" },
      { number: 9, name: "Youssef En-Nesyri", position: "ST" },
    ],
  },
  9: {
    home: [
      { number: 16, name: "Mike Maignan", position: "GK" },
      { number: 2, name: "Davide Calabria", position: "RB" },
      { number: 23, name: "Fikayo Tomori", position: "CB" },
      { number: 13, name: "Matteo Gabbia", position: "CB" },
      { number: 19, name: "Theo Hernández", position: "LB" },
      { number: 4, name: "Ismael Bennacer", position: "CDM" },
      { number: 8, name: "Ruben Loftus-Cheek", position: "CM" },
      { number: 14, name: "Tijjani Reijnders", position: "CM" },
      { number: 11, name: "Christian Pulišić", position: "RW" },
      { number: 9, name: "Olivier Giroud", position: "ST" },
      { number: 17, name: "Rafael Leão", position: "LW" },
    ],
    away: [
      { number: 1, name: "Alex Meret", position: "GK" },
      { number: 22, name: "Giovanni Di Lorenzo", position: "RB" },
      { number: 13, name: "Amir Rrahmani", position: "CB" },
      { number: 5, name: "Juan Jesus", position: "CB" },
      { number: 6, name: "Mario Rui", position: "LB" },
      { number: 68, name: "Stanislav Lobotka", position: "CDM" },
      { number: 20, name: "Piotr Zieliński", position: "CM" },
      { number: 99, name: "Khvicha Kvaratskhelia", position: "LW" },
      { number: 21, name: "Matteo Politano", position: "RW" },
      { number: 77, name: "Giacomo Raspadori", position: "CAM" },
      { number: 9, name: "Victor Osimhen", position: "ST" },
    ],
  },
  10: {
    home: [
      { number: 1, name: "Pietro Terracciano", position: "GK" },
      { number: 2, name: "Dodô", position: "RB" },
      { number: 4, name: "Nikola Milenković", position: "CB" },
      { number: 5, name: "Lucas Martínez Quarta", position: "CB" },
      { number: 3, name: "Cristiano Biraghi", position: "LB" },
      { number: 32, name: "Alfred Duncan", position: "CDM" },
      { number: 8, name: "Sofyan Amrabat", position: "CM" },
      { number: 22, name: "Giacomo Bonaventura", position: "CM" },
      { number: 7, name: "Nicolás González", position: "RW" },
      { number: 9, name: "Luca Jović", position: "ST" },
      { number: 10, name: "Gaetano Castrovilli", position: "LW" },
    ],
    away: [
      { number: 1, name: "Odysseas Vlachodimos", position: "GK" },
      { number: 5, name: "Oleg Reabciuk", position: "RB" },
      { number: 4, name: "Sokratis Papastathopoulos", position: "CB" },
      { number: 3, name: "Konstantinos Mavropanos", position: "CB" },
      { number: 17, name: "Mady Camara", position: "CDM" },
      { number: 8, name: "Andreas Bouchalakis", position: "CM" },
      { number: 6, name: "Pape Abou Cissé", position: "CM" },
      { number: 11, name: "Mathieu Valbuena", position: "RW" },
      { number: 7, name: "Youssef El-Arabi", position: "ST" },
      { number: 10, name: "Kostas Fortounis", position: "LW" },
      { number: 9, name: "Giorgos Masouras", position: "SS" },
    ],
  },
  11: {
    home: [
      { number: 1, name: "Lukáš Hrádecký", position: "GK" },
      { number: 5, name: "Odilon Kossounou", position: "RB" },
      { number: 4, name: "Jonathan Tah", position: "CB" },
      { number: 3, name: "Edmond Tapsoba", position: "CB" },
      { number: 18, name: "Alejandro Grimaldo", position: "LB" },
      { number: 10, name: "Granit Xhaka", position: "CDM" },
      { number: 8, name: "Exequiel Palacios", position: "CM" },
      { number: 14, name: "Florian Wirtz", position: "CAM" },
      { number: 11, name: "Jonas Hofmann", position: "RW" },
      { number: 9, name: "Victor Boniface", position: "ST" },
      { number: 30, name: "Amine Adli", position: "LW" },
    ],
    away: [
      { number: 1, name: "Peter Gulácsi", position: "GK" },
      { number: 5, name: "David Raum", position: "LB" },
      { number: 4, name: "Willi Orbán", position: "CB" },
      { number: 6, name: "Mohamed Simakan", position: "CB" },
      { number: 16, name: "Lukas Klostermann", position: "RB" },
      { number: 8, name: "Laimer", position: "CDM" },
      { number: 27, name: "Dani Olmo", position: "CM" },
      { number: 17, name: "Xavi Simons", position: "CAM" },
      { number: 11, name: "Timo Werner", position: "LW" },
      { number: 9, name: "Lois Openda", position: "ST" },
      { number: 10, name: "Emil Forsberg", position: "RW" },
    ],
  },
  12: {
    home: [
      { number: 1, name: "Radosław Majecki", position: "GK" },
      { number: 2, name: "Vanderson", position: "RB" },
      { number: 5, name: "Axel Disasi", position: "CB" },
      { number: 3, name: "Mohamed Camara", position: "CB" },
      { number: 18, name: "Caio Henrique", position: "LB" },
      { number: 29, name: "Denis Zakaria", position: "CDM" },
      { number: 8, name: "Youssouf Fofana", position: "CM" },
      { number: 10, name: "Takumi Minamino", position: "CAM" },
      { number: 7, name: "Krepin Diatta", position: "RW" },
      { number: 9, name: "Wissam Ben Yedder", position: "ST" },
      { number: 11, name: "Myron Boadu", position: "LW" },
    ],
    away: [
      { number: 1, name: "Anthony Lopes", position: "GK" },
      { number: 2, name: "Malo Gusto", position: "RB" },
      { number: 4, name: "Sinaly Diomandé", position: "CB" },
      { number: 3, name: "Castello Lukeba", position: "CB" },
      { number: 18, name: "Nicolas Tagliafico", position: "LB" },
      { number: 8, name: "Maxence Caqueret", position: "CDM" },
      { number: 6, name: "Corentin Tolisso", position: "CM" },
      { number: 10, name: "Rayan Cherki", position: "CAM" },
      { number: 11, name: "Tetê", position: "RW" },
      { number: 9, name: "Alexandre Lacazette", position: "ST" },
      { number: 7, name: "Ernest Nuamah", position: "LW" },
    ],
  },
  13: {
    home: [
      { number: 1, name: "Marc-André ter Stegen", position: "GK" },
      { number: 23, name: "Jules Koundé", position: "RB" },
      { number: 4, name: "Ronald Araújo", position: "CB" },
      { number: 15, name: "Andreas Christensen", position: "CB" },
      { number: 3, name: "Alejandro Baldé", position: "LB" },
      { number: 5, name: "Sergio Busquets", position: "CDM" },
      { number: 21, name: "Frenkie de Jong", position: "CM" },
      { number: 8, name: "Pedri", position: "CM" },
      { number: 11, name: "Raphinha", position: "RW" },
      { number: 9, name: "Robert Lewandowski", position: "ST" },
      { number: 7, name: "Ferran Torres", position: "LW" },
    ],
    away: [
      { number: 1, name: "Odysseas Vlachodimos", position: "GK" },
      { number: 2, name: "Tomás Araújo", position: "RB" },
      { number: 4, name: "António Silva", position: "CB" },
      { number: 3, name: "Nicolás Otamendi", position: "CB" },
      { number: 5, name: "Álex Grimaldo", position: "LB" },
      { number: 8, name: "Florentino Luís", position: "CDM" },
      { number: 10, name: "João Mário", position: "CM" },
      { number: 7, name: "Fredrik Aursnes", position: "CM" },
      { number: 11, name: "David Neres", position: "RW" },
      { number: 9, name: "Gonçalo Ramos", position: "ST" },
      { number: 17, name: "Ángel Di María", position: "LW" },
    ],
  },
};

// ─── События матча ────────────────────────────────────────────────────────────
// ВРЕМЕННО захардкожено. После подключения FastAPI — удали весь объект LIVE_EVENTS.
// События будут приходить в поле events внутри ответа GET /api/matches/{id}
// Модель в PostgreSQL: MatchEvent (id, match_id, minute, type, team, player_name, detail)
// Для live-обновлений можно добавить WebSocket или polling каждые 30 сек

const LIVE_EVENTS: Record<number, MatchEvent[]> = {
  2: [
    { minute: 12, type: "goal", team: "away", player: "Vinícius Júnior", detail: "Left foot, 6 yards" },
    { minute: 34, type: "yellow", team: "home", player: "Sergio Busquets", detail: "Tactical foul" },
    { minute: 41, type: "goal", team: "home", player: "Robert Lewandowski", detail: "Header from corner" },
    { minute: 67, type: "goal", team: "away", player: "Jude Bellingham", detail: "Long range strike" },
    { minute: 72, type: "yellow", team: "away", player: "Toni Kroos", detail: "Dissent" },
    { minute: 78, type: "sub", team: "home", player: "Ferran Torres → Gavi", detail: "Tactical change" },
  ],
  4: [
    { minute: 8, type: "yellow", team: "away", player: "Mattéo Guendouzi", detail: "Reckless challenge" },
    { minute: 23, type: "var", team: "home", player: "Kylian Mbappé", detail: "Goal disallowed – offside" },
    { minute: 45, type: "sub", team: "away", player: "Pau López → Ngapandouetnbu", detail: "Injury" },
  ],
  7: [
    { minute: 5, type: "goal", team: "home", player: "Bukayo Saka", detail: "Penalty" },
    { minute: 29, type: "yellow", team: "away", player: "Moises Caicedo", detail: "Late tackle" },
    { minute: 38, type: "goal", team: "home", player: "Leandro Trossard", detail: "Close range" },
    { minute: 52, type: "goal", team: "away", player: "Nicolas Jackson", detail: "Counter attack" },
    { minute: 61, type: "yellow", team: "home", player: "Declan Rice", detail: "Simulation" },
    { minute: 74, type: "sub", team: "away", player: "Raheem Sterling → Cole Palmer", detail: "Tactical" },
  ],
};

const EVENT_ICONS: Record<string, string> = {
  goal: "⚽",
  yellow: "🟨",
  red: "🟥",
  sub: "🔄",
  var: "📺",
};

const REFEREES = [
  "Anthony Taylor", "Michael Oliver", "Martin Atkinson", "Chris Kavanagh",
  "Clément Turpin", "Félix Brych", "Slavko Vinčić", "Carlos del Cerro Grande",
  "Daniele Orsato", "Björn Kuipers",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isPlaying, setIsPlaying] = useState(false);
  const [match, setMatch] = useState<StoredMatch | null>(null);

  useEffect(() => {
    const id = Number(matchId);

    // ═══════════════════════════════════════════════════════════════════════
    // ЗАМЕНИТЬ НА → GET /api/matches/{id}
    //
    // Ожидаемый ответ от FastAPI (один матч + детальные данные):
    // {
    //   id, home_team, away_team, league, stadium, start_time,
    //   is_live, is_main_match, viewers, home_score, away_score,
    //   possession_home, shots_home, shots_away,
    //
    //   // Составы — подтягиваются из твоей БД через связь Match → MatchLineup → Player
    //   lineups: {
    //     home: [{ id, number, name, position, country, photo_url }],
    //     away: [{ id, number, name, position, country, photo_url }],
    //   },
    //
    //   // События матча — таблица MatchEvent в PostgreSQL
    //   events: [
    //     { minute, type: "goal"|"yellow"|"red"|"sub"|"var", team: "home"|"away",
    //       player_name, detail }
    //   ],
    //
    //   // Судья — можно хранить в таблице Referee
    //   referee: { name, country },
    // }
    //
    // Пример вызова:
    // const token = localStorage.getItem("token");
    // const res = await fetch(`/api/matches/${id}`, {
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    // if (!res.ok) { setMatch(null); return; }
    // const data = await res.json();
    // setMatch(data);
    //
    // После подключения бэкенда — удали константы LINEUPS и LIVE_EVENTS выше,
    // они будут приходить из data.lineups и data.events
    // ═══════════════════════════════════════════════════════════════════════

    // Временная заглушка — localStorage + seed:
    try {
      const raw = localStorage.getItem("adminMatches");
      if (raw) {
        const list: StoredMatch[] = JSON.parse(raw);
        const found = list.find(m => m.id === id);
        if (found) { setMatch(found); return; }
      }
    } catch {}
    const fallback = SEED_MATCHES.find(m => m.id === id) ?? null;
    setMatch(fallback);
  }, [matchId]);

  // ── Derived data ──────────────────────────────────────────────────────────

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <p className="text-white text-xl mb-2">Match not found</p>
          <button
            onClick={() => navigate("/matches")}
            className="mt-4 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  const startTime = new Date(match.startTime);
  const isLive = match.isLive;
  const hasStarted = startTime <= new Date();
  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;
  const possession = match.possession ?? { home: 50, away: 50 };
  const shots = match.shots ?? { home: 0, away: 0 };
  const lineup = LINEUPS[match.id] ?? null;
  const events = LIVE_EVENTS[match.id] ?? [];
  const referee = REFEREES[match.id % REFEREES.length];

  const corners = { home: Math.floor(shots.home * 0.7), away: Math.floor(shots.away * 0.7) };
  const fouls = { home: Math.max(3, Math.floor(12 - possession.home / 8)), away: Math.max(3, Math.floor(12 - possession.away / 8)) };
  const shotsOnTarget = { home: Math.floor(shots.home * 0.45), away: Math.floor(shots.away * 0.45) };

  const fmt = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
    { id: "lineups", label: "Lineups", icon: <List className="w-4 h-4" /> },
    { id: "stats", label: "Statistics", icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/matches")}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl text-white tracking-tight">ToporFootball</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm">
            <span>{match.league}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{match.homeTeam} vs {match.awayTeam}</span>
          </div>
        </div>
      </header>

      {/* ── Match Hero ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* League + live badge */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-slate-400 text-sm uppercase tracking-wider">{match.league}</span>
            {isLive ? (
              <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/30 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-xs font-medium tracking-wider">LIVE</span>
              </div>
            ) : (
              <span className="text-slate-500 text-sm">{hasStarted ? "Finished" : "Upcoming"}</span>
            )}
          </div>

          {/* Teams + score */}
          <div className="flex items-center justify-between max-w-3xl mx-auto mb-8">
            <div className="flex-1 text-center">
              <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-2xl mx-auto mb-3 flex items-center justify-center text-4xl">
                🏠
              </div>
              <div className="text-white text-xl">{match.homeTeam}</div>
              <div className="text-slate-500 text-xs mt-1">Home</div>
            </div>

            <div className="px-6 text-center">
              {isLive ? (
                <div>
                  <div className="text-5xl text-white tabular-nums">
                    {homeScore} <span className="text-slate-600">–</span> {awayScore}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400 text-xs uppercase tracking-wider">In Progress</span>
                  </div>
                </div>
              ) : hasStarted ? (
                <div className="text-5xl text-white tabular-nums">
                  {homeScore} <span className="text-slate-600">–</span> {awayScore}
                </div>
              ) : (
                <div>
                  <div className="text-3xl text-slate-600 mb-1">vs</div>
                  <div className="text-green-400 text-sm">{fmt(startTime)}</div>
                </div>
              )}
            </div>

            <div className="flex-1 text-center">
              <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-2xl mx-auto mb-3 flex items-center justify-center text-4xl">
                ✈️
              </div>
              <div className="text-white text-xl">{match.awayTeam}</div>
              <div className="text-slate-500 text-xs mt-1">Away</div>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-slate-400 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{fmtDate(startTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{fmt(startTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{match.stadium}</span>
            </div>
            {match.viewers != null && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{match.viewers.toLocaleString()} watching</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Ref: {referee}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Video Player ───────────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="relative bg-black" style={{ paddingBottom: "56.25%", height: 0 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              {isLive ? (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-600/20 border-2 border-green-500/30 flex items-center justify-center mb-5">
                    {isPlaying
                      ? <div className="flex gap-1.5"><div className="w-3 h-8 bg-white rounded" /><div className="w-3 h-8 bg-white rounded" /></div>
                      : <Play className="w-9 h-9 text-white fill-white ml-1" />
                    }
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400 text-sm font-medium tracking-wider">LIVE BROADCAST</span>
                  </div>
                  <p className="text-white text-lg mb-1">{match.homeTeam} {homeScore} – {awayScore} {match.awayTeam}</p>
                  <p className="text-slate-400 text-sm mb-6">{match.league} · {match.stadium}</p>
                  <button
                    onClick={() => setIsPlaying((p) => !p)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl transition-colors"
                  >
                    {isPlaying
                      ? <><div className="flex gap-1"><div className="w-1.5 h-5 bg-white rounded" /><div className="w-1.5 h-5 bg-white rounded" /></div><span>Pause</span></>
                      : <><Play className="w-4 h-4 fill-white" /><span>Watch Live</span></>
                    }
                  </button>
                  <div className="flex gap-4 mt-4 text-slate-500 text-xs">
                    <span>HD 1080p</span><span>·</span><span>Low latency</span>
                    {match.viewers && <><span>·</span><span>{match.viewers.toLocaleString()} viewers</span></>}
                  </div>
                </div>
              ) : !hasStarted ? (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <Clock className="w-14 h-14 text-slate-600 mb-4" />
                  <p className="text-white text-lg mb-1">Stream not started yet</p>
                  <p className="text-slate-400 text-sm mb-6">Broadcast begins at {fmt(startTime)}</p>
                  <div className="scale-90 origin-top">
                    <CountdownTimer targetDate={startTime} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <Flag className="w-14 h-14 text-slate-600 mb-4" />
                  <p className="text-white text-lg mb-1">Match Finished</p>
                  <p className="text-slate-400 text-sm">
                    Final score: {match.homeTeam} {homeScore} – {awayScore} {match.awayTeam}
                  </p>
                </div>
              )}
            </div>
          </div>
          {isLive && (
            <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400">LIVE</span>
                <span className="text-slate-600">·</span>
                <span>{match.stadium}</span>
              </div>
              <span className="text-slate-500">HD · Auto quality</span>
            </div>
          )}
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-green-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ──────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Countdown for upcoming */}
            {!isLive && !hasStarted && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-4">Match starts in</p>
                <CountdownTimer targetDate={startTime} />
              </div>
            )}

            {/* Events timeline */}
            {isLive && events.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white mb-4 flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4 text-green-400" />
                  Match Events
                </h3>
                <div className="space-y-3">
                  {[...events].reverse().map((ev, i) => (
                    <div key={i} className={`flex items-center gap-3 ${ev.team === "away" ? "flex-row-reverse" : ""}`}>
                      <span className="text-slate-500 text-xs w-8 shrink-0 text-center">{ev.minute}'</span>
                      <span className="text-base shrink-0">{EVENT_ICONS[ev.type]}</span>
                      <div className={`flex-1 ${ev.team === "away" ? "text-right" : ""}`}>
                        <p className="text-white text-sm">{ev.player}</p>
                        {ev.detail && <p className="text-slate-500 text-xs">{ev.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live snapshot */}
            {isLive && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white mb-4 text-base">Live Snapshot</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>{match.homeTeam}</span>
                    <span>Possession</span>
                    <span>{match.awayTeam}</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-blue-500 flex items-center justify-end pr-1.5 transition-all duration-500" style={{ width: `${possession.home}%` }}>
                      <span className="text-white text-[10px]">{possession.home}%</span>
                    </div>
                    <div className="bg-orange-500 flex items-center pl-1.5 transition-all duration-500" style={{ width: `${possession.away}%` }}>
                      <span className="text-white text-[10px]">{possession.away}%</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Shots", h: shots.home, a: shots.away },
                    { label: "On Target", h: shotsOnTarget.home, a: shotsOnTarget.away },
                    { label: "Corners", h: corners.home, a: corners.away },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-800 rounded-lg p-3 text-center">
                      <div className="flex justify-between mb-1">
                        <span className="text-white">{s.h}</span>
                        <span className="text-white">{s.a}</span>
                      </div>
                      <span className="text-slate-500 text-xs">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Match info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white mb-4 flex items-center gap-2 text-base">
                <Info className="w-4 h-4 text-slate-400" />
                Match Information
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                {[
                  { label: "Competition", value: match.league },
                  { label: "Stadium", value: match.stadium },
                  { label: "Date", value: fmtDate(startTime) },
                  { label: "Kick-off", value: fmt(startTime) },
                  { label: "Referee", value: referee },
                  { label: "Status", value: isLive ? "Live" : hasStarted ? "Finished" : "Upcoming" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-white text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Lineups ───────────────────────────────────────────────────── */}
        {activeTab === "lineups" && (
          lineup ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {(
                [
                  { team: match.homeTeam, players: lineup.home, label: "Home" },
                  { team: match.awayTeam, players: lineup.away, label: "Away" },
                ] as const
              ).map(({ team, players, label }) => (
                <div key={team} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-base">{team}</h3>
                    <span className="text-slate-500 text-xs uppercase">{label} · 4-3-3</span>
                  </div>
                  <div className="space-y-2">
                    {players.map((p) => (
                      <div
                        key={p.number}
                        className="flex items-center gap-3 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                      >
                        <div className="w-8 h-8 bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center text-slate-300 text-sm shrink-0">
                          {p.number}
                        </div>
                        <span className="flex-1 text-white text-sm truncate">{p.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded shrink-0">
                          {p.position}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <List className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">Lineups will be announced 1 hour before kick-off</p>
            </div>
          )
        )}

        {/* ── Tab: Statistics ────────────────────────────────────────────────── */}
        {activeTab === "stats" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            {isLive || hasStarted ? (
              <div className="space-y-6">
                <h3 className="text-white text-base">Match Statistics</h3>
                {[
                  { label: "Possession", h: possession.home, a: possession.away, max: 100, unit: "%" },
                  { label: "Shots", h: shots.home, a: shots.away, max: Math.max(shots.home, shots.away, 1) * 1.2 },
                  { label: "Shots on Target", h: shotsOnTarget.home, a: shotsOnTarget.away, max: Math.max(shotsOnTarget.home, shotsOnTarget.away, 1) * 1.2 },
                  { label: "Corners", h: corners.home, a: corners.away, max: Math.max(corners.home, corners.away, 1) * 1.2 },
                  { label: "Fouls", h: fouls.home, a: fouls.away, max: Math.max(fouls.home, fouls.away, 1) * 1.2 },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-white w-10">{s.h}{s.unit ?? ""}</span>
                      <span className="text-slate-500 text-xs">{s.label}</span>
                      <span className="text-white w-10 text-right">{s.a}{s.unit ?? ""}</span>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div className="flex-1 bg-slate-800 rounded-full overflow-hidden flex justify-end">
                        <div className="bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${(s.h / s.max) * 100}%` }} />
                      </div>
                      <div className="flex-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${(s.a / s.max) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                      <span>{match.homeTeam}</span>
                      <span>{match.awayTeam}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">Statistics available once the match begins</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
