import { useUserStore } from '@/stores/index.js';

const userStore = useUserStore();

export const isAuthor = (authorId) => {
	return authorId === userStore.user.userId;
}
