import { TextInput, type TextInputProps } from "react-native";

import { digitsOnly } from "@/lib/text";

type Props = Omit<TextInputProps, "onChangeText" | "value" | "keyboardType" | "secureTextEntry"> & {
  value: string;
  onChangeText: (pin: string) => void;
  maxLength?: number;
};

export function PinInput({ value, onChangeText, maxLength = 6, className, ...rest }: Props) {
  return (
    <TextInput
      {...rest}
      value={value}
      onChangeText={(t) => onChangeText(digitsOnly(t).slice(0, maxLength))}
      keyboardType="number-pad"
      secureTextEntry
      maxLength={maxLength}
      className={
        className ??
        "rounded-xl border border-gray-300 dark:border-neutral-700 px-4 py-3 text-center text-xl tracking-widest text-mission-text dark:text-neutral-100"
      }
    />
  );
}
