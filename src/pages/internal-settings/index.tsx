import { storage, StorageKey } from "@/utils/storage";
import { Switch } from "antd";
import { useEffect, useState } from "react";

const InternalSettings = () => {
  const [internal, setInternal] = useState(false);

  useEffect(() => {
    const internal = storage.get(StorageKey.INTERNAL_SIGNUP) === 1;
    setInternal(internal);
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
    </div>
  );
};

export default InternalSettings;
