export type Language = 'EN' | 'AL';

export interface CategoryTranslationDto {
  language: Language;
  name: string;
}

export interface CategoryRequest {
  translations: CategoryTranslationDto[];
}

export interface CategoryResponse {
  id: number;
  translations: CategoryTranslationDto[];
  createdAt: string;
}

export interface CategoryPublicResponse {
  id: number;
  name: string;
}