import { api } from "@/trpc/react";
import { getQueryKey } from "@trpc/react-query";
import React from "react";
import { useLocalStorage } from "usehooks-ts";

const useThreads = () => {
  const { data: accounts } = api.mail.getAccounts.useQuery();
  const [accountId] = useLocalStorage("accountId", "");
  const [tab] = useLocalStorage("normalhuman-tab", "inbox");
  const [done] = useLocalStorage("normalhuman-done", false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  console.log("useThreads debug:", { accounts, accountId, tab, done, mounted });

  const queryKey = getQueryKey(
    api.mail.getThreads,
    { accountId, tab, done },
    "query",
  );
  const {
    data: threads,
    isFetching,
    refetch,
  } = api.mail.getThreads.useQuery(
    {
      accountId,
      done,
      tab,
    },
    {
      enabled: !!accountId && !!tab && mounted,
      placeholderData: (e) => e,
      refetchInterval: 1000 * 5,
    },
  );

  return {
    threads,
    isFetching,
    account: accounts?.find((account) => account.id === accountId),
    refetch,
    accounts,
    queryKey,
    accountId,
  };
};

export default useThreads;
