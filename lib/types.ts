export interface SecretFormData {
  message: string;
  expiration: string;
  password: string;
  usePassword: boolean;
}

export interface SecretAccessData {
  id: string;
  password?: string;
}

export const EXPIRATION_OPTIONS = [
  {value: "60000", label: "1 minute"},
  {value: "3600000", label: "1 hour"},
  {value: "86400000", label: "1 day"},
  {value: "604800000", label: "1 week"},
];

export const MAX_MESSAGE_LENGTH = 10000;