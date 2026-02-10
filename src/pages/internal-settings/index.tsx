import { storage, StorageKey } from "@/utils/storage";
import { Switch } from "antd";
import { useEffect, useState } from "react";

const InternalSettings = () => {
  const [internal, setInternal] = useState(false);
  const [skipVerifyingToken, setSkipVerifyingToken] = useState(false);

  useEffect(() => {
    const internal = storage.get(StorageKey.INTERNAL_SIGNUP) === 1;
    setInternal(internal);

    const skipVerifyingToken =
      storage.get(StorageKey.SKIP_VERIFYING_TOKEN) === 1;
    setSkipVerifyingToken(skipVerifyingToken);
  }, []);

  return (
    <div style={{ width: 800, margin: "100px auto" }}>
      <h3>Internal Settings</h3>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div>Skip binding email:</div>
        <Switch
          checked={internal}
          onChange={(checked) => {
            storage.set(StorageKey.INTERNAL_SIGNUP, checked ? 1 : 0);
            setInternal(checked);
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginTop: 8,
        }}
      >
        <div>Skip verifying token for signup:</div>
        <Switch
          checked={skipVerifyingToken}
          onChange={(checked) => {
            storage.set(StorageKey.SKIP_VERIFYING_TOKEN, checked ? 1 : 0);
            setSkipVerifyingToken(checked);
          }}
        />
      </div>
    </div>
  );
};

export default InternalSettings;
