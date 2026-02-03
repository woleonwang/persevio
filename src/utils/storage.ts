/**
 * 存储键名枚举 - 统一管理所有存储 key
 */
export enum StorageKey {
  // Token 相关
  TOKEN = "token",
  CANDIDATE_TOKEN = "candidate_token",
  COWORKER_TOKEN = "coworker_token",
  TRIAL_USER_UUID = "trial_user_uuid",

  // 会话相关
  SESSION_ID = "sessionId",
  SHARE_TOKEN = "share_token",
  SOURCE_CHANNEL = "source_channel",
  LINKEDIN_PROFILE_ID = "linkedin_profile_id",

  // 业务数据
  JOB_DOT = "job_dot",
  SNAKE_HIGH_SCORE = "snakeHighScore",
  EDIT_MESSAGE_GUIDE = "edit_message_guide",

  // 是否是测试账号
  INTERNAL_ACCOUNT = "internal_account",
  // 登录时的 job id 来源
  SIGNIN_JOB_ID = "signin_job_id",
}

/**
 * 存储的数据结构（包含过期时间）
 */
interface StorageData<T> {
  value: T;
  expiresAt?: number;
}

/**
 * 判断是否为新的存储格式（StorageData 包装）
 */
function isNewFormat(data: string): boolean {
  try {
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === "object" && "value" in parsed;
  } catch {
    return false;
  }
}

/**
 * 统一的存储工具类
 * 支持向前兼容：自动识别旧格式（直接字符串）和新格式（StorageData 包装）
 */
class Storage {
  /**
   * 设置值
   * @param key 存储键
   * @param value 存储值
   * @param expiresIn 过期时间（毫秒），不传则不过期
   */
  set<T>(key: StorageKey, value: T, expiresIn?: number): boolean {
    try {
      // 如果不需要过期时间，直接存储（保持向前兼容）
      if (!expiresIn) {
        if (typeof value === "string") {
          // 字符串直接存储，兼容旧格式
          localStorage.setItem(key, value);
        } else {
          // 对象存储为 JSON 字符串
          localStorage.setItem(key, JSON.stringify(value));
        }
        return true;
      }

      // 需要过期时间的，使用新格式
      const data: StorageData<T> = {
        value,
        expiresAt: Date.now() + expiresIn,
      };
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      // 处理存储空间不足等情况
      console.error(`Failed to set storage key "${key}":`, error);
      return false;
    }
  }

  /**
   * 获取值
   * @param key 存储键
   * @param defaultValue 默认值（当 key 不存在时返回）
   */
  get<T>(key: StorageKey, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return defaultValue ?? null;
      }

      // 检查是否为新格式
      if (isNewFormat(item)) {
        const data: StorageData<T> = JSON.parse(item);

        // 检查是否过期
        if (data.expiresAt && Date.now() > data.expiresAt) {
          this.remove(key);
          return defaultValue ?? null;
        }

        return data.value;
      }

      // 旧格式：直接返回字符串或尝试解析 JSON
      // 尝试解析为 JSON（兼容 share_token, job_dot 等）
      try {
        return JSON.parse(item) as T;
      } catch {
        // 解析失败，返回原始字符串
        return item as T;
      }
    } catch (error) {
      console.error(`Failed to get storage key "${key}":`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * 获取原始字符串值（不进行 JSON 解析）
   */
  getRaw(key: StorageKey): string | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }

      // 如果是新格式，提取 value
      if (isNewFormat(item)) {
        const data: StorageData<unknown> = JSON.parse(item);

        // 检查是否过期
        if (data.expiresAt && Date.now() > data.expiresAt) {
          this.remove(key);
          return null;
        }

        // 如果 value 是字符串，直接返回
        if (typeof data.value === "string") {
          return data.value;
        }
        // 否则序列化为字符串
        return JSON.stringify(data.value);
      }

      // 旧格式：直接返回
      return item;
    } catch (error) {
      console.error(`Failed to get raw storage key "${key}":`, error);
      return null;
    }
  }

  /**
   * 移除值
   */
  remove(key: StorageKey): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove storage key "${key}":`, error);
      return false;
    }
  }

  /**
   * 清空所有存储
   */
  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Failed to clear storage:", error);
      return false;
    }
  }

  /**
   * 检查 key 是否存在
   */
  has(key: StorageKey): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * 获取所有存储的 key
   */
  keys(): StorageKey[] {
    return Object.values(StorageKey).filter((key) => this.has(key));
  }
}

// 导出单例
export const storage = new Storage();

/**
 * Token 管理工具（针对 token 的特殊封装）
 */
export const tokenStorage = {
  /**
   * 设置 token
   * @param token token 值
   * @param role 角色类型
   * @param expiresIn 过期时间（毫秒），默认 7 天
   */
  setToken: (
    token: string,
    role: "staff" | "candidate" | "coworker" | "trial_user" = "staff",
    expiresIn?: number
  ) => {
    const keyMap = {
      staff: StorageKey.TOKEN,
      candidate: StorageKey.CANDIDATE_TOKEN,
      coworker: StorageKey.COWORKER_TOKEN,
      trial_user: StorageKey.TRIAL_USER_UUID,
    };
    // Token 默认 7 天过期，但为了兼容，先不设置过期时间
    // 如果传入了 expiresIn，则使用新格式；否则使用旧格式（直接字符串）
    if (expiresIn) {
      return storage.set(keyMap[role], token, expiresIn);
    } else {
      // 兼容旧格式：直接存储字符串
      return storage.set(keyMap[role], token);
    }
  },

  /**
   * 获取 token
   */
  getToken: (
    role: "staff" | "candidate" | "coworker" | "trial_user" = "staff"
  ): string | null => {
    const keyMap = {
      staff: StorageKey.TOKEN,
      candidate: StorageKey.CANDIDATE_TOKEN,
      coworker: StorageKey.COWORKER_TOKEN,
      trial_user: StorageKey.TRIAL_USER_UUID,
    };
    const result = storage.get<string>(keyMap[role]);
    // 确保返回字符串类型
    return result ? String(result) : null;
  },

  /**
   * 移除 token
   */
  removeToken: (
    role: "staff" | "candidate" | "coworker" | "trial_user" = "staff"
  ) => {
    const keyMap = {
      staff: StorageKey.TOKEN,
      candidate: StorageKey.CANDIDATE_TOKEN,
      coworker: StorageKey.COWORKER_TOKEN,
      trial_user: StorageKey.TRIAL_USER_UUID,
    };
    return storage.remove(keyMap[role]);
  },

  /**
   * 清空所有 token
   */
  clearAllTokens: () => {
    storage.remove(StorageKey.TOKEN);
    storage.remove(StorageKey.CANDIDATE_TOKEN);
    storage.remove(StorageKey.COWORKER_TOKEN);
    storage.remove(StorageKey.TRIAL_USER_UUID);
  },
};
