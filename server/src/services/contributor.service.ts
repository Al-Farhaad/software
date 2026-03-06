import { Contributor } from "../models/contributor.model";
import { HttpError } from "../utils/http-error";
import { buildSearchPattern } from "../utils/search";

interface ContributorFilters {
  search?: string;
}

export interface CreateContributorInput {
  name: string;
  phoneNo?: string;
  email?: string;
  address?: string;
}

export interface UpdateContributorInput {
  name?: string;
  phoneNo?: string;
  email?: string;
  address?: string;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const normalizeOptionalValue = (value?: string) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const randomContributorCode = () => {
  const prefix =
    LETTERS[Math.floor(Math.random() * LETTERS.length)] +
    LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `${prefix}${suffix}`;
};

const generateUniqueContributorId = async () => {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = randomContributorCode();
    const exists = await Contributor.exists({ contributorId: candidate });
    if (!exists) {
      return candidate;
    }
  }
  throw new HttpError(500, "Could not generate unique contributor ID.");
};

export const createContributor = async (payload: CreateContributorInput) => {
  const contributorId = await generateUniqueContributorId();
  return Contributor.create({
    contributorId,
    name: payload.name.trim(),
    phoneNo: normalizeOptionalValue(payload.phoneNo),
    email: normalizeOptionalValue(payload.email),
    address: normalizeOptionalValue(payload.address),
  });
};

export const listContributors = async (filters: ContributorFilters) => {
  const query: Record<string, unknown> = {};
  const pattern = buildSearchPattern(filters.search);
  if (pattern) {
    query.$or = [
      { name: pattern },
      { phoneNo: pattern },
      { email: pattern },
      { contributorId: pattern },
    ];
  }
  return Contributor.find(query).sort({ createdAt: -1 }).lean();
};

export const updateContributorById = async (id: string, payload: UpdateContributorInput) => {
  const setPayload: Record<string, string> = {};
  const unsetPayload: Record<string, 1> = {};

  if (payload.name !== undefined) {
    setPayload.name = payload.name.trim();
  }

  if (payload.phoneNo !== undefined) {
    const nextPhone = normalizeOptionalValue(payload.phoneNo);
    if (nextPhone) {
      setPayload.phoneNo = nextPhone;
    } else {
      unsetPayload.phoneNo = 1;
    }
  }

  if (payload.email !== undefined) {
    const nextEmail = normalizeOptionalValue(payload.email);
    if (nextEmail) {
      setPayload.email = nextEmail;
    } else {
      unsetPayload.email = 1;
    }
  }

  if (payload.address !== undefined) {
    const nextAddress = normalizeOptionalValue(payload.address);
    if (nextAddress) {
      setPayload.address = nextAddress;
    } else {
      unsetPayload.address = 1;
    }
  }

  const updatePayload: Record<string, Record<string, unknown>> = {};
  if (Object.keys(setPayload).length) {
    updatePayload.$set = setPayload;
  }
  if (Object.keys(unsetPayload).length) {
    updatePayload.$unset = unsetPayload;
  }

  const contributor = await Contributor.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!contributor) {
    throw new HttpError(404, "Contributor not found.");
  }

  return contributor;
};

export const deleteContributorById = async (id: string) => {
  const contributor = await Contributor.findByIdAndDelete(id).lean();

  if (!contributor) {
    throw new HttpError(404, "Contributor not found.");
  }
};
