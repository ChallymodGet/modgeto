"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormFieldset } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ShowcaseSection, Specimen } from "./section";

const units = [
  { value: "BUSINESS_DAYS", label: "Business days" },
  { value: "CALENDAR_DAYS", label: "Calendar days" },
  { value: "WEEKS", label: "Weeks" },
];

export function FormsDemo() {
  const [about, setAbout] = useState("A florist delivering same-day arrangements across Lagos.");

  return (
    <ShowcaseSection
      id="forms"
      title="Form fields"
      description="FormField wires the label, description and error to the control and sets aria-invalid. Required fields are the default; optional fields say so."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Specimen label="Text" className="flex flex-col gap-6">
          <FormField label="Full name" required>
            <Input autoComplete="name" placeholder="Kemi Adeyemi" />
          </FormField>
          <FormField
            label="Phone number"
            description="Include your country code, for example +234."
            required
          >
            <Input type="tel" autoComplete="tel" defaultValue="+234 803" />
          </FormField>
          <FormField
            label="Email address"
            error="Enter a valid email address, like name@example.com."
            required
          >
            <Input type="email" defaultValue="kemi@" />
          </FormField>
          <FormField label="Location" optional>
            <Input placeholder="Lagos, Nigeria" />
          </FormField>
          <FormField label="Username" description="Usernames can't be changed here." disabled>
            <Input defaultValue="ada" />
          </FormField>
          <FormField label="Reference" description="Read only">
            <Input readOnly defaultValue="MG-1041" />
          </FormField>
        </Specimen>

        <Specimen label="Long text, numbers and select" className="flex flex-col gap-6">
          <FormField
            label="Tell us about your business"
            description="Who you serve and what makes you different."
            required
          >
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={500}
              showCount
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Turnaround" required>
              <NumberInput defaultValue={3} min={1} max={52} unitLabel="turnaround" />
            </FormField>
            <FormField label="Unit" required>
              <Select items={units} defaultValue="WEEKS">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Number of posts" description="12 to 30 posts.">
            <NumberInput defaultValue={12} min={12} max={30} unitLabel="posts" />
          </FormField>
          <FormField label="Category" error="Choose a category." required>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESIGN">Design</SelectItem>
                <SelectItem value="DEVELOPMENT">Development</SelectItem>
                <SelectItem value="WRITING">Writing</SelectItem>
                <SelectItem value="MOTION_MEDIA">Motion and Media</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </Specimen>

        <Specimen label="Checkboxes and switches" className="flex flex-col gap-5">
          <FormField
            orientation="horizontal"
            label="I've read and accept the Service terms"
            description="You can review the terms again before Ready to Start."
          >
            <Checkbox />
          </FormField>
          <FormField orientation="horizontal" label="Checked" error="Accept the terms to continue.">
            <Checkbox defaultChecked />
          </FormField>
          <FormField orientation="horizontal" label="Disabled" disabled>
            <Checkbox disabled />
          </FormField>
          <FormField
            orientation="horizontal"
            label="Email me when a new Request arrives"
            description="In-app notifications stay on."
          >
            <Switch defaultChecked />
          </FormField>
          <FormField orientation="horizontal" label="Weekly summary">
            <Switch />
          </FormField>
        </Specimen>

        <Specimen label="Radio group" className="flex flex-col gap-6">
          <FormFieldset
            legend="How do you want to be paid?"
            description="Shown to the Client at the payment stage."
          >
            <RadioGroup defaultValue="bank">
              <RadioItem
                value="bank"
                label="Bank transfer"
                description="Account name, number and bank."
              />
              <RadioItem value="paypal" label="PayPal" />
              <RadioItem value="mobile" label="Mobile money" disabled />
            </RadioGroup>
          </FormFieldset>
          <FormFieldset legend="Availability" error="Choose your availability.">
            <RadioGroup>
              <RadioItem value="AVAILABLE" label="Available" />
              <RadioItem
                value="LIMITED"
                label="Limited availability"
                description="You still accept new Requests."
              />
              <RadioItem
                value="UNAVAILABLE"
                label="Unavailable"
                description="New Requests are paused. Existing ones continue."
              />
            </RadioGroup>
          </FormFieldset>
        </Specimen>
      </div>
    </ShowcaseSection>
  );
}
