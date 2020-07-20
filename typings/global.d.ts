declare module "*.graphql" {
  const value: any;
  export default value;
}

interface String {
  replaceAll: (searchvalue: string, newvalue: string) => string;
  trimAll: (text: string) => string;
}