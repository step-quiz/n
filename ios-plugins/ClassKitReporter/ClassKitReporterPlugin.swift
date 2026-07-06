//
//  ClassKitReporterPlugin.swift
//  Step Quiz — Pont Capacitor ↔ ClassKit
//
//  Aquesta classe exposa els mètodes de ClassKitReporter al món JavaScript
//  (native-bridge.js). Els decoradors @objc són imprescindibles perquè el
//  runtime de Capacitor pugui veure la classe i els seus mètodes.
//
//  Registre: cal registrar-lo a capacitorDidLoad() (vegeu CLASSKIT-SETUP.md).
//

import Foundation
import Capacitor

@objc(ClassKitReporterPlugin)
public class ClassKitReporterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ClassKitReporterPlugin"
    public let jsName = "ClassKitReporter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable",     returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "publishActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reportScore",     returnType: CAPPluginReturnPromise)
    ]

    private let implementation = ClassKitReporter()

    /// JS: ClassKitReporter.isAvailable() -> { available: Bool }
    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": implementation.isAvailable()])
    }

    /// JS: ClassKitReporter.publishActivity({ identifier, title }) -> { ok, error? }
    @objc func publishActivity(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier"),
              let title = call.getString("title") else {
            call.reject("Falten paràmetres: identifier i title són obligatoris.")
            return
        }
        implementation.publishActivity(identifier: identifier, title: title) { error in
            if let error = error {
                call.resolve(["ok": false, "error": error])
            } else {
                call.resolve(["ok": true])
            }
        }
    }

    /// JS: ClassKitReporter.reportScore({ identifier, score }) -> { ok, error? }
    /// score és 0.0–1.0.
    @objc func reportScore(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier") else {
            call.reject("Falta el paràmetre identifier.")
            return
        }
        let score = call.getDouble("score") ?? 0.0
        implementation.reportScore(identifier: identifier, score: score) { error in
            if let error = error {
                call.resolve(["ok": false, "error": error])
            } else {
                call.resolve(["ok": true])
            }
        }
    }
}
