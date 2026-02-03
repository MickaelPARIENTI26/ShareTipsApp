// --- Auth ---
export interface User {
  id: string;
  email: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

// --- Match (list view from GET /api/matches) ---
export interface MatchListItem {
  id: string;
  sportCode: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  startTime: string;
  status: string;
  marketsCount: number;
}

// --- Match (detail view from GET /api/matches/:id) ---
export interface MatchDetail {
  id: string;
  sportCode: string;
  leagueName: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  startTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  markets: Market[];
}

export interface TeamInfo {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
}

export interface Market {
  id: string;
  type: string;
  label: string;
  line: number | null;
  selections: MarketSelection[];
}

export interface MarketSelection {
  id: string;
  code: string;
  label: string;
  odds: number;
  playerName: string | null;
}

// --- Ticket Builder ---
export interface TicketSelection {
  matchId: string;
  matchLabel: string;
  leagueName: string;
  sportCode: string;
  startTime: string;
  selectionId: string;
  marketType: string;
  marketLabel: string;
  selectionLabel: string;
  odds: number;
}

export interface TicketDraft {
  selections: TicketSelection[];
  totalOdds: number;
  confidenceIndex: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  priceEur: number | null;
}

// --- Pagination ---
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// --- Ticket DTO (from backend) ---
export interface TicketDto {
  id: string;
  creatorId: string;
  creatorUsername: string;
  title: string;
  isPublic: boolean;
  priceEur: number;
  confidenceIndex: number;
  avgOdds: number;
  sports: string[];
  firstMatchTime: string;
  status: string;
  result: string;
  createdAt: string;
  selections: TicketSelectionDto[];
  selectionCount: number;
  isPurchasedByCurrentUser: boolean;
  isSubscribedToCreator: boolean;
}

export interface TicketSelectionDto {
  id: string;
  matchId: string;
  marketType: string;
  selectionLabel: string;
  odds: number;
  playerName: string | null;
  matchLabel: string | null;
  leagueName: string | null;
  matchStartTime: string | null;
  matchStatus: string | null;
  homeScore: number | null;
  awayScore: number | null;
  result: 'Pending' | 'Win' | 'Lose';
}

// --- Filter Meta ---
export interface TicketFilterMetaDto {
  minOdds: number;
  maxOdds: number;
  minConfidence: number;
  maxConfidence: number;
  availableSports: string[];
  minSelections: number;
  maxSelections: number;
}

// --- Subscriptions ---
export type SubscriptionStatus = 'Active' | 'Expired' | 'Cancelled';

export interface SubscriptionDto {
  id: string;
  subscriberId: string;
  subscriberUsername: string;
  tipsterId: string;
  tipsterUsername: string;
  priceEur: number;
  commissionEur: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export interface SubscriptionResultDto {
  success: boolean;
  message: string | null;
  subscription: SubscriptionDto | null;
}

export interface SubscriptionStatusDto {
  isSubscribed: boolean;
  endDate: string | null;
  remainingDays: number;
  wasSubscribed: boolean;
  previousEndDate: string | null;
}

// --- Subscription Plans ---
export interface SubscriptionPlanDto {
  id: string;
  tipsterUserId: string;
  title: string;
  description: string | null;
  durationInDays: number;
  priceEur: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateSubscriptionPlanRequest {
  title: string;
  description?: string;
  durationInDays: number;
  priceEur: number;
}

export interface UpdateSubscriptionPlanRequest {
  title?: string;
  description?: string;
  durationInDays?: number;
  priceEur?: number;
  isActive?: boolean;
}

// --- Purchases ---
export interface PurchaseDto {
  id: string;
  ticketId: string;
  ticketTitle: string;
  sellerId: string;
  sellerUsername: string;
  buyerId: string;
  buyerUsername: string;
  priceEur: number;
  commissionEur: number;
  sellerEarningsEur: number;
  createdAt: string;
}

export interface PurchaseResultDto {
  success: boolean;
  message: string | null;
  purchase: PurchaseDto | null;
}

// --- Favorites ---
export interface FavoriteTicketDto {
  id: string;
  ticketId: string;
  ticketTitle: string;
  creatorId: string;
  creatorUsername: string;
  isPublic: boolean;
  priceEur: number;
  confidenceIndex: number;
  avgOdds: number;
  sports: string[];
  firstMatchTime: string;
  status: string;
  result: string;
  favoritedAt: string;
}

export interface FavoriteResultDto {
  isFavorited: boolean;
  message: string;
}

// --- User Profile ---
export interface CurrentUserDto {
  id: string;
  email: string;
  username: string;
  stats: UserStatsDto | null;
}

export interface UserProfileDto {
  id: string;
  username: string;
  ranking: RankingDto | null;
  stats: UserStatsDto | null;
}

export interface UserStatsDto {
  ticketsCreated: number;
  ticketsSold: number;
  roi: number;
  avgOdds: number;
  followersCount: number;
}

export interface RankingDto {
  daily: number;
  weekly: number;
  monthly: number;
}

// --- Tipster Advanced Stats ---
export interface TipsterStatsDto {
  totalTicketsCreated: number;
  ticketsSold: number;
  uniqueBuyers: number;
  winningTickets: number;
  losingTickets: number;
  pendingTickets: number;
  winRate: number;
  winLossRatio: number;
  averageOdds: number;
  averageWinningOdds: number | null;
  averageConfidence: number;
  revenueGrossEur: number;
  revenueNetEur: number;
  highestWinningOdd: number | null;
  longestWinningStreak: number;
  longestLosingStreak: number;
}

// --- Notifications ---
export type NotificationType =
  | 'NewTicket'
  | 'MatchStart'
  | 'TicketWon'
  | 'TicketLost'
  | 'SubscriptionExpire'
  | 'FollowNewTicket';

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  dataJson: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationData {
  ticketId?: string;
  tipsterId?: string;
  matchId?: string;
  [key: string]: string | undefined;
}

// --- Navigation ---
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  CGV: undefined;
  CGU: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  MatchDetails: { matchId: string; title?: string };
  TicketPreview: { draft: TicketDraft };
  MyTickets: undefined;
  TipsterProfile: { tipsterId: string; tipsterUsername: string };
  MesFavoris: undefined;
  MesAchats: undefined;
  MesAbonnements: undefined;
  TicketDetail: { ticketId: string };
  Wallet: undefined;
  Notifications: undefined;
  NotificationPreferences: undefined;
  Statistiques: undefined;
  MesAbonnes: undefined;
  MesPlansAbonnement: undefined;
  Historique: undefined;
  CGU: undefined;
  CGV: undefined;
  PrivacyPolicy: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Marketplace: undefined;
  Matches: undefined;
  Ranking: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  SportsList: undefined;
  LeagueList: { sportCode: string; sportName: string };
  MatchList: { sportCode: string; sportName: string; leagueName?: string };
};

// --- Stripe ---
export type StripeOnboardingStatus = 'None' | 'Pending' | 'Completed';

export interface OnboardingLinkDto {
  url: string;
  expiresAt: string;
}

export interface ConnectedAccountStatusDto {
  status: StripeOnboardingStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsMessage: string | null;
}

export interface PaymentIntentResultDto {
  success: boolean;
  clientSecret: string | null;
  paymentId: string | null;
  message: string | null;
}

export interface TipsterWalletDto {
  availableBalance: number;
  pendingPayout: number;
  totalEarned: number;
}

export interface PayoutResultDto {
  success: boolean;
  message: string | null;
  amount: number | null;
  payoutId: string | null;
}

export interface PayoutRequest {
  amountCents: number | null;
}
