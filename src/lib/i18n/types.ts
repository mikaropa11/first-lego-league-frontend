export type Language = "ca" | "es" | "en";

export interface Translations {
  // ============ NAVIGATION & COMMON ============
  nav: {
    teams: string;
    scientificProjects: string;
    matches: string;
    modules: string;
    editions: string;
    volunteers: string;
    administrators: string;
    competitionTables: string;
    projectRooms: string;
  };

  breadcrumb: {
    home: string;
    editions: string;
    teams: string;
    matches: string;
    scientificProjects: string;
    projectRooms: string;
    volunteers: string;
    administrators: string;
    competitionTables: string;
    users: string;
  };

  // ============ HOME PAGE ============
  home: {
    eyebrow: string;
    title: string;
    description: string;
    competitionHub: string;
    platformModules: string;
    platformDescription: string;
    openModule: string;
    tagline: string;
    modules: {
      teams: { title: string; description: string };
      volunteers: { title: string; description: string };
      matches: { title: string; description: string };
      scientificProjects: { title: string; description: string };
      projectRooms: { title: string; description: string };
      competitionTables: { title: string; description: string };
      administrators: { title: string; description: string };
    };
  };

  // ============ AUTHENTICATION ============
  auth: {
    logout: string;
    user: string;
    login: string;
    username: string;
    password: string;
    forgotPassword: string;
    createAccount: string;
    memberAccess: string;
    loginDescription: string;
    invalidCredentials: string;
    usernameRequired: string;
    passwordRequired: string;
    passwordMinLength: string;
    loggingIn: string;
  };

  language: {
    changeLanguage: string;
    closeMenu: string;
    catalan: string;
    spanish: string;
    english: string;
  };

  footer: {
    title: string;
    description: string;
    navigationLabel: string;
    opensInNewTab: string;
    githubOrganization: string;
    allRepositories: string;
    apiDocumentation: string;
    swaggerUi: string;
    scoreboard: string;
    liveRankings: string;
    copyright: string;
    backToHome: string;
  };

  // ============ COMMON UI ============
  common: {
    loading: string;
    error: string;
    back: string;
    close: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    filter: string;
    sort: string;
    actions: string;
    noResults: string;
    confirm: string;
    confirmDelete: string;
    confirmDeleteMessage: string;
    success: string;
    failed: string;
    tryAgain: string;
    previous: string;
    next: string;
    page: string;
    of: string;
    rowsPerPage: string;
    showing: string;
    to: string;
    challenge: string;
    and: string;
    explore: string;
    teamsCurrentView: string;
    toggleDarkMode: string;
  };

  // ============ TEAMS PAGE ============
  teams: {
    title: string;
    description: string;
    management: string;
    searchPlaceholder: string;
    createTeam: string;
    createNew: string;
    teamName: string;
    members: string;
    memberCount: string;
    noTeams: string;
    noTeamsFound: string;
    deleteTeam: string;
    editTeam: string;
    addMember: string;
    removeMember: string;
    teamDetails: string;
    memberName: string;
    memberEmail: string;
    memberRole: string;
    captain: string;
    member: string;
    viewDetails: string;
    updateTeam: string;
    confirmDeleteTeam: string;
    teamDeleted: string;
    teamCreated: string;
    teamUpdated: string;
    school: string;
    city: string;
    region: string;
    citiesRepresented: string;
    citiesRepresentedDescYes: string;
    citiesRepresentedDescNo: string;
    schoolsAndCenters: string;
    schoolsAndCentersDescYes: string;
    schoolsAndCentersDescNo: string;
    categoriesActive: string;
    categoriesActiveDescNo: string;
    challengeAnd: string;
    founded: string;
    registered: string;
    challengeCategory: string;
    exploreCategory: string;
  };

  // ============ EDITIONS PAGE ============
  editions: {
    title: string;
    description: string;
    searchPlaceholder: string;
    createEdition: string;
    editionYear: string;
    noEditions: string;
    noEditionsFound: string;
    deleteEdition: string;
    editEdition: string;
    leaderboard: string;
    rounds: string;
    teams: string;
    awards: string;
    editionDetails: string;
    viewDetails: string;
    updateEdition: string;
    confirmDeleteEdition: string;
    editionDeleted: string;
    editionCreated: string;
    editionUpdated: string;
    status: string;
    startDate: string;
    endDate: string;
    location: string;
    totalTeams: string;
    totalMatches: string;
    totalRounds: string;
    leaderboardTitle: string;
    rank: string;
    teamName: string;
    points: string;
    noResultsYet: string;
    noResultsYetDescription: string;
    participatingTeams: string;
    finalClassification: string;
    mediaGallery: string;
    noTeamsInEdition: string;
    noAwardsYet: string;
    noAwardsYetDescription: string;
    noMediaFound: string;
    noMediaFoundDescription: string;
    management: string;
    createNew: string;
    tbd: string;
    editionArchive: string;
    season: string;
    venue: string;
    stateLabel: string;
    editionBrief: string;
    profileUnavailable: string;
    searchByYearVenueState: string;
    searchByYearVenueStateLabel: string;
    filterByState: string;
    allStates: string;
    seasonsInView: string;
    seasonsInViewDescription: string;
    noSeasonMatchesSearch: string;
    venuesListed: string;
    venuesListedDescription: string;
    venueDataUnavailable: string;
    statesTracked: string;
    latestVisibleSeason: string;
    seasonMetadataUnavailable: string;
    noEditionsMatch: string;
    noEditionsForState: string;
    noEditionsAvailable: string;
  };

  // ============ MATCHES PAGE ============
  matches: {
    title: string;
    description: string;
    searchPlaceholder: string;
    createMatch: string;
    matchName: string;
    team1: string;
    team2: string;
    score: string;
    result: string;
    noMatches: string;
    noMatchesFound: string;
    deleteMatch: string;
    editMatch: string;
    matchDetails: string;
    referee: string;
    round: string;
    date: string;
    time: string;
    location: string;
    status: string;
    scheduled: string;
    inProgress: string;
    completed: string;
    cancelled: string;
    team1Score: string;
    team2Score: string;
    winner: string;
    draw: string;
    viewDetails: string;
    updateMatch: string;
    confirmDeleteMatch: string;
    matchDeleted: string;
    matchCreated: string;
    matchUpdated: string;
    table: string;
    competitionSchedule: string;
    liveListing: string;
    matchSchedule: string;
    teamFilterLabel: string;
    searchByTeamName: string;
    viewList: string;
    viewCalendar: string;
    noMatchesFoundForTeam: string;
    noMatchesAvailable: string;
    tryAnotherTeamName: string;
    matchInformation: string;
    participatingTeams: string;
    scores: string;
    refereeActions: string;
    editResult: string;
    recordResult: string;
    unknownTeam: string;
    startTime: string;
    endTime: string;
    teams: string;
    unknownTeams: string;
    search: string;
    reset: string;
    listCaption: string;
    live: string;
    noScheduledMatches: string;
    matchesLoadError: string;
    matchesLoadErrorPrefix: string;
    noValidMatchTimes: string;
    unassigned: string;
    newMatch: string;
    createMatchDescription: string;
    editMatchTitle: string;
    updateMatchDescription: string;
    matchNotFound: string;
    matchCouldNotBeLoaded: string;
  };

  media: {
    title: string;
    notFoundTitle: string;
    notFoundDescription: string;
    viewDescription: string;
    noUrlMessage: string;
    youtubeMedia: string;
  };

  // ============ SCIENTIFIC PROJECTS PAGE ============
  scientificProjects: {
    eyebrow: string;
    title: string;
    description: string;

    newProject: string;

    projectList: string;
    seasonOverview: string;
    searchDescription: string;

    edition: string;
    team: string;

    noProjects: string;
    noProjectsDescription: string;
    noProjectsMatch: string;

    projectsInView: string;
    evaluatedProjects: string;
    roomsAssigned: string;

    projectsInViewDescFiltered: string;
    projectsInViewDesc: string;

    noScoresYet: string;
    noAverageScore: string;

    roomsAssignedDesc: string;

    project: string;
    scientificProject: string;

    evaluated: string;
    roomAssigned: string;
    pendingReview: string;

    score: string;
    room: string;

    awaitingScore: string;
    pendingAssignment: string;

    presentingTeam: string;

    viewDetails: string;
    detailsUnavailable: string;

    moveDirectory: string;
    innovationProjects: string;
    teamPending: string;
    average: string;
    with: string;
    projectsPending: string;
    noProjectsAvailable: string;
    projectsFiltered: string;
    projectsDirectory: string;
    noProjectsScored: string;
    projectsLinked: string;
    roomsNotPublished: string;
    paginationLabel: string;
    projectRanking: string;
    projectRankingTitle: string;
    projectRankingDescription: string;
    projectScoresNotPublic: string;
    projectScoresNotPublicDescription: string;
    projectScore: string;
    projectRoom: string;
    notScored: string;
    unassigned: string;

    form: {
        projectName: string;
        description: string;
        edition: string;
        team: string;

        select: string;
        selectEdition: string;
        selectTeam: string;
        selectEditionFirst: string;

        requiredProjectName: string;
        requiredDescription: string;
        requiredEdition: string;
        requiredTeam: string;

        max100: string;
        max400: string;

        operationFailed: string;
    };
  };

  // ============ PROJECT ROOMS PAGE ============
  projectRooms: {
    title: string;
    description: string;
    searchPlaceholder: string;
    createRoom: string;
    roomName: string;
    judges: string;
    noRooms: string;
    noRoomsFound: string;
    deleteRoom: string;
    editRoom: string;
    roomDetails: string;
    assignProject: string;
    schedule: string;
    startTime: string;
    endTime: string;
    capacity: string;
    assignedProjects: string;
    availableProjects: string;
    noProjects: string;
    viewDetails: string;
    updateRoom: string;
    confirmDeleteRoom: string;
    roomDeleted: string;
    roomCreated: string;
    roomUpdated: string;
    location: string;
    judge: string;
    roomDirectory: string;
    allProjectRooms: string;
    roomDirectoryDescription: string;
    noProjectRooms: string;
    noProjectRoomsDescription: string;
    managingJudge: string;
    panel: string;
    panelists: string;
    noPanelistsAssigned: string;
    innovation: string;
    assignedScientificProjects: string;
    noProjectsAssigned: string;
    openJudgeEvaluationView: string;
    room: string;
    team: string;
    score: string;
    comments: string;
  };

  // ============ EVALUATION ROOMS PAGE ============
  evaluationRooms: {
    title: string;
    description: string;
    noProjectsAssigned: string;
    noProjectsAssignedDescription: string;
    scientificProjectLabel: string;
    evaluatedStatus: string;
    pendingStatus: string;
    openEvaluation: string;
    unknownTeam: string;
  };

  // ============ VOLUNTEERS PAGE ============
  volunteers: {
    title: string;
    description: string;
    searchPlaceholder: string;
    createVolunteer: string;
    volunteerName: string;
    email: string;
    phone: string;
    noVolunteers: string;
    noVolunteersFound: string;
    deleteVolunteer: string;
    editVolunteer: string;
    volunteerDetails: string;
    role: string;
    availability: string;
    experience: string;
    viewDetails: string;
    updateVolunteer: string;
    confirmDeleteVolunteer: string;
    volunteerDeleted: string;
    volunteerCreated: string;
    volunteerUpdated: string;
    address: string;
    city: string;
    region: string;
    directory: string;
    directoryDescription: string;
    judges: string;
    referees: string;
    floaters: string;
    noJudges: string;
    noReferees: string;
    noFloaters: string;
    expert: string;
    unknownVolunteer: string;
    judgesDescription: string;
    refereesDescription: string;
    floatersDescription: string;
    searchRole: string;
    unknown: string;
    deleteConfirmation: string;
    deleting: string;
    notFound: string;
    unnamed: string;
    expertJudge: string;
    yes: string;
    no: string;
    judgeInfo: string;
    accessDeniedAdmin: string;
    editVolunteerTitle: string;
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
    isExpertRole: string;
    failedToUpdate: string;
    saving: string;
    saveChanges: string;
  };

  // ============ ADMINISTRATORS PAGE ============
  administrators: {
    eyebrow: string;
    title: string;
    description: string;
    systemAdministrators: string;
    directory: string;
    selectAdministrator: string;
    searchPlaceholder: string;
    createAdministrator: string;
    createAdministratorDescription: string;
    username: string;
    usernamePlaceholder: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    administratorName: string;
    email: string;
    role: string;
    noAdministrators: string;
    noAdministratorsDescription: string;
    noAdministratorsFound: string;
    deleteAdministrator: string;
    deleteAdministratorConfirmationPrefix: string;
    deleteAdministratorConfirmationSuffix: string;
    cannotDeleteOwnAccount: string;
    administratorLabel: string;
    editAdministrator: string;
    administratorDetails: string;
    permissions: string;
    lastLogin: string;
    status: string;
    active: string;
    inactive: string;
    viewDetails: string;
    updateAdministrator: string;
    confirmDeleteAdministrator: string;
    administratorDeleted: string;
    administratorCreated: string;
    administratorUpdated: string;
    superAdmin: string;
    admin: string;
    moderator: string;
  };

  // ============ COMPETITION TABLES PAGE ============
  competitionTables: {
    title: string;
    description: string;
    management: string;
    searchPlaceholder: string;
    createTable: string;
    createTableTitle: string;
    createTableDescription: string;
    creatingTable: string;
    tableIdentifier: string;
    tableIdentifierPlaceholder: string;
    tableIdentifierRequired: string;
    tableName: string;
    referees: string;
    noTables: string;
    noTablesDescription: string;
    noTablesFound: string;
    noRefereesAssigned: string;
    searchRefereesPlaceholder: string;
    noRefereesFound: string;
    deleteTable: string;
    editTable: string;
    tableDetails: string;
    assignReferee: string;
    assignRefereeButton: string;
    removeReferee: string;
    confirmReassign: string;
    assignedTo: string;
    willBeReassigned: string;
    refereesAssigned: string;
    maxRefereesReached: string;
    referee: string;
    round: string;
    status: string;
    viewDetails: string;
    updateTable: string;
    confirmDeleteTable: string;
    tableDeleted: string;
    tableCreated: string;
    tableUpdated: string;
    location: string;
    schedule: string;
  };

  // ============ USERS PAGE ============
  users: {
    title: string;
    profile: string;
    userName: string;
    email: string;
    role: string;
    noUsers: string;
    noUsersFound: string;
    deleteUser: string;
    editUser: string;
    userDetails: string;
    myProfile: string;
    editProfile: string;
    changePassword: string;
    preferences: string;
    logout: string;
    lastLogin: string;
    registeredSince: string;
    accountStatus: string;
    peopleDirectory: string;
    registeredUsers: string;
    directory: string;
    selectProfileDetails: string;
    noRegisteredUsers: string;
    noUsersMatchSearch: string;
    profileNotFoundTitle: string;
    profileNotFoundDescription: string;
    userDetailsHeading: string;
    viewProfile: string;
    home: string;
  };

  // ============ FORMS & VALIDATION ============
  forms: {
    required: string;
    invalid: string;
    submit: string;
    reset: string;
    fieldRequired: string;
    invalidEmail: string;
    invalidPhone: string;
    passwordRequired: string;
    passwordTooShort: string;
    passwordsDoNotMatch: string;
    minLength: string;
    maxLength: string;
    characterMinimum: string;
    enterValidValue: string;
    selectAnOption: string;
    selectAtLeastOne: string;
    noFileSelected: string;
    fileTooLarge: string;
    invalidFileType: string;
    uploadSuccess: string;
    uploadFailed: string;
  };

  // ============ DIALOGS & CONFIRMATIONS ============
  dialogs: {
    deleteConfirm: string;
    deleteConfirmMessage: string;
    areYouSure: string;
    thisActionCannotBeUndone: string;
    confirmAction: string;
    cancel: string;
    delete: string;
    assignReferee: string;
    selectReferee: string;
    selectTeam: string;
    selectProject: string;
    selectJudge: string;
    addMember: string;
    selectMember: string;
    updateSuccessful: string;
    creationSuccessful: string;
    deletionSuccessful: string;
    operationFailed: string;
    pleaseCheckForm: string;
  };

  // ============ EMPTY STATES & MESSAGES ============
  empty: {
    noTeams: string;
    noEditions: string;
    noMatches: string;
    noProjects: string;
    noRooms: string;
    noVolunteers: string;
    noAdministrators: string;
    noTables: string;
    noUsers: string;
    noResults: string;
    tryAdjustingFilters: string;
    startByCreating: string;
    nothingToShow: string;
    noTeamsDescription: string;
  };

  // ============ ERRORS ============
  errors: {
    somethingWentWrong: string;
    errorOccurred: string;
    tryAgain: string;
    contactSupport: string;
    pageNotFound: string;
    accessDenied: string;
    unauthorizedAccess: string;
    sessionExpired: string;
    pleaseLogin: string;
    networkError: string;
    loadingFailed: string;
    savingFailed: string;
    deletingFailed: string;
  };

  // ============ TABLE HEADERS ============
  table: {
    name: string;
    email: string;
    role: string;
    status: string;
    date: string;
    actions: string;
    view: string;
    edit: string;
    delete: string;
    select: string;
    sort: string;
    filter: string;
    columns: string;
    team: string;
    totalScore: string;
    matchesPlayed: string;
  };

  // ============ FILTERS & SEARCH ============
  filters: {
    search: string;
    filterBy: string;
    sortBy: string;
    sortAscending: string;
    sortDescending: string;
    applyFilters: string;
    resetFilters: string;
    noFiltersApplied: string;
    resultsFound: string;
    category: string;
    educationalCenter: string;
    allCategories: string;
    allEducationalCenters: string;
  };

  // ============ PAGINATION ============
  pagination: {
    previous: string;
    next: string;
    page: string;
    of: string;
    rowsPerPage: string;
    showing: string;
    to: string;
    entries: string;
  };
}
