export type CreatorIdentityType = "individual" | "agency";

export type CreatorVerificationType = "government_id" | "passport" | "business_license";

export interface CreatorApplicationBasicInformation {
  identityType: CreatorIdentityType;
  fullName: string;
  workEmail: string;
  country: string;
  portfolioLink: string;
}

export interface CreatorApplicationCreativeInformation {
  contentCategory: string;
  primaryLanguage: string;
  primaryPlatforms: string[];
  socialLink: string;
  shortBio: string;
}

export interface CreatorApplicationIdentityVerification {
  verificationType: CreatorVerificationType;
  documentNumber: string;
  issueCountry: string;
  taxIdOrBusinessId: string;
  documentFileName: string;
}

export interface CreatorApplicationAgreement {
  acceptedTerms: boolean;
  acceptedAuthenticity: boolean;
  signatureName: string;
}

export interface CreatorApplicationDraft {
  basicInformation: CreatorApplicationBasicInformation;
  creativeInformation: CreatorApplicationCreativeInformation;
  identityVerification: CreatorApplicationIdentityVerification;
  agreement: CreatorApplicationAgreement;
  lastCompletedStep: number;
  updatedAt: string;
}

