// This file is used to create dummy data for testing purposes
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User, UserDocument, UserInfo } from "../../app/models/user";
import { faker } from "@faker-js/faker";
import {
  FeedbackDocument,
  FeedbackType,
  Review,
  GradedFeedbackDocument,
  GradedFeedbackType,
  Vote,
} from "../../app/models/review";
import { Return, ReturnDocument, ReturnType } from "../../app/models/return";
import { Guide, GuideDocument, GuideType } from "../../app/models/guide";
import { ExtendedGuideInfo, GuideInfo, Module } from "../../app/guides/types";
import { extendGuides } from "../../app/guides/utils";
import { create } from "domain";

jest.mock("../../app/utils/mongoose-connector", () => ({
  connectToDatabase: jest.fn(),
}));

const mongod = new MongoMemoryServer();

export const connect = async () => {
  await mongod.start();
  const uri = await mongod.getUri();

  await mongoose.connect(uri);
};

export const closeDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

export const clearDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

export const createDummyUser = async (
  role: "user" | "teacher" = "user"
): Promise<UserDocument> => {
  const dummyUser: UserInfo = {
    name: faker.person.firstName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role,
    createdAt: new Date(),
    background: faker.person.bio(),
    careerGoals: faker.lorem.sentence(),
    interests: faker.lorem.sentence(),
    favoriteArtists: faker.lorem.sentence(),
    avatarUrl: faker.image.url(),
  };

  return await User.create(dummyUser);
};

export const createDummyGuide = async (): Promise<GuideDocument> => {
  const dummyGuide: Partial<GuideType> = {
    category: faker.lorem.word(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    createdAt: new Date(),
    updatedAt: new Date(),
    themeIdea: {
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
    },
    topicsList: faker.lorem.words(),
    module: {
      title: Math.floor(Math.random() * 10) + faker.lorem.sentence(),
      number: faker.number.int(10),
    },
    order: faker.number.int(50),
  };

  return await Guide.create(dummyGuide);
};

export const createDummyModules = (count: number): Module[] => {
  const modules = [];
  for (let i = 0; i < count; i++) {
    const module = {
      title: i + faker.lorem.sentence(),
      number: i,
    };
    modules.push(module);
  }
  return modules;
};

export const createDummyReturn = async (
  user?: UserDocument,
  guide?: GuideDocument | ExtendedGuideInfo
): Promise<ReturnDocument> => {
  const dummyReturn: Partial<ReturnType> = {
    projectUrl: faker.internet.url(),
    liveVersion: faker.internet.url(),
    pictureUrl: faker.image.url(),
    projectName: faker.commerce.productName(),
    comment: faker.lorem.sentence(),
    owner: user?._id ?? new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    guide: guide?._id ?? new mongoose.Types.ObjectId(),
  };

  return await Return.create(dummyReturn);
};

export const createDummyFeedback = async (
  owner?: UserDocument,
  guide?: GuideDocument,
  userReturn?: ReturnType,
  fail?: boolean
): Promise<FeedbackDocument> => {
  const dummyReview: Partial<FeedbackType> = {
    guide: guide?._id ?? new mongoose.Types.ObjectId(),
    return: userReturn?._id ?? new mongoose.Types.ObjectId(),
    owner: owner?._id ?? new mongoose.Types.ObjectId(),
    comment: faker.lorem.sentence(),
    vote: fail ? Vote.NO_PASS : Vote.PASS,
    createdAt: new Date(),
  };

  return await Review.create(dummyReview);
};

export const createDummyGrade = async (
  owner?: UserDocument,
  guide?: GuideDocument,
  userReturn?: ReturnType,
  grade?: number
): Promise<GradedFeedbackDocument> => {
  const votes = [Vote.NO_PASS, Vote.PASS, Vote.RECOMMEND_TO_GALLERY];

  const dummyReview: Partial<GradedFeedbackType> = {
    guide: guide?._id ?? new mongoose.Types.ObjectId(),
    return: userReturn?._id ?? new mongoose.Types.ObjectId(),
    grade: grade ?? faker.number.int(10),
    owner: owner?._id ?? new mongoose.Types.ObjectId(),
    comment: faker.lorem.sentence(),
    vote: votes[Math.floor(Math.random() * votes.length)],
    createdAt: new Date(),
  };

  return await Review.create(dummyReview);
};

export const createDummyFetchedGuides = async (
  user: UserDocument,
  count: number
): Promise<GuideInfo[]> => {
  const guides = [];
  for (let i = 0; i < count; i++) {
    const guide = await createDummyGuide();
    const fetchedGuide: GuideInfo = {
      _id: guide._id,
      title: guide.title,
      description: guide.description,
      category: guide.category,
      order: 0,
      module: guide.module,
      returnsSubmitted:
        Math.random() > 0.5 ? [await createDummyReturn(user, guide)] : [],
      feedbackReceived:
        Math.random() > 0.5
          ? [await createDummyFeedback(undefined, guide)]
          : [],
      availableForFeedback:
        Math.random() > 0.5 ? [await createDummyReturn(undefined, guide)] : [],
      feedbackGiven:
        Math.random() > 0.5 ? [await createDummyFeedback(user, guide)] : [],
      gradesReceived:
        Math.random() > 0.5 ? [await createDummyGrade(user, guide)] : [],
      gradesGiven:
        Math.random() > 0.5 ? [await createDummyGrade(undefined, guide)] : [],
      availableToGrade:
        Math.random() > 0.5
          ? [await createDummyFeedback(undefined, guide)]
          : [],
    };
    guides.push(fetchedGuide);
  }
  return guides;
};

export const createDummyFetchedGuidedWithNoReturn = async (
  user: UserDocument
) => {
  const guide = await createDummyGuide();
  const fetchedGuide: GuideInfo = {
    _id: guide._id,
    title: guide.title,
    description: guide.description,
    category: guide.category,
    order: 0,
    module: guide.module,
    returnsSubmitted: [],
    feedbackReceived: [],
    availableForFeedback: [],
    feedbackGiven: [],
    gradesReceived: [],
    gradesGiven: [],
    availableToGrade: [],
  };
  const extendedGuide = await extendGuides([fetchedGuide]);
  return extendedGuide[0];
};

type dummyGuideDetails = {
  feedbackReceived?: number;
  availableForFeedback?: number;
  feedbackGiven?: number;
  gradesReceived?: number;
  gradesGiven?: number;
  availableToGrade?: number;
};

export const createDummyFetchedGuideWithControl = async (
  user: UserDocument,
  dummyGuideDetails: dummyGuideDetails
): Promise<ExtendedGuideInfo> => {
  const guide = await createDummyGuide();

  const userReturn = await createDummyReturn(user, guide);

  const {
    feedbackReceived,
    availableForFeedback,
    feedbackGiven,
    gradesReceived,
    gradesGiven,
    availableToGrade,
  } = dummyGuideDetails;

  const feedbackReceivedPromises = Array.from({
    length: feedbackReceived ?? 0,
  }).map(() => createDummyFeedback(undefined, guide, userReturn));

  const availableForFeedbackPromises = Array.from({
    length: availableForFeedback ?? 0,
  }).map(() => createDummyReturn(undefined, guide));

  const feedbackGivenPromises = Array.from({
    length: feedbackGiven ?? 0,
  }).map(() => createDummyFeedback(user, guide));

  const gradesReceivedPromises = Array.from({
    length: gradesReceived ?? 0,
  }).map(() => createDummyGrade(user, guide, userReturn));

  const gradesGivenPromises = Array.from({
    length: gradesGiven ?? 0,
  }).map(() => createDummyGrade(undefined, guide));

  const availableToGradePromises = Array.from({
    length: availableToGrade ?? 0,
  }).map(() => createDummyFeedback(undefined, guide));

  const fetchedGuide: GuideInfo = {
    _id: guide._id,
    title: guide.title,
    description: guide.description,
    category: guide.category,
    order: 0,
    module: guide.module,
    returnsSubmitted: [userReturn],
    feedbackReceived: await Promise.all(feedbackReceivedPromises),
    availableForFeedback: await Promise.all(availableForFeedbackPromises),
    feedbackGiven: await Promise.all(feedbackGivenPromises),
    gradesReceived: await Promise.all(gradesReceivedPromises),
    gradesGiven: await Promise.all(gradesGivenPromises),
    availableToGrade: await Promise.all(availableToGradePromises),
  };

  const extendedGuides = await extendGuides([fetchedGuide]);
  return extendedGuides[0];
};

export const createDummyExtendedGuides = async (
  user: UserDocument,
  count: number
) => {
  const dummyGuides = await createDummyFetchedGuides(user, count);
  const dummyExtendedGuides = await extendGuides(dummyGuides);
  return dummyExtendedGuides;
};
