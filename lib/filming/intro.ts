export const INTRO_STORAGE_KEY = "filming-intro-seen";

/**
 * Inline in the server layout so it runs before first paint and returning
 * visitors in the same session never see the loader flash.
 */
export const markIntroSeenScript = `try{if(sessionStorage.getItem("${INTRO_STORAGE_KEY}"))document.documentElement.dataset.filmingIntro="seen"}catch(e){}`;
