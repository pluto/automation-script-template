// Declare module for Vite's ?raw import suffix
declare module "*?raw" {
  const content: string;
  export default content;
}
