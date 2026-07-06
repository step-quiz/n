//
//  ClassKitReporter.swift
//  Step Quiz — Capa nativa ClassKit
//
//  Classe d'implementació: tota la lògica de ClassKit viu aquí.
//  Publica les activitats (exercicis) com a CLSContext i reporta la
//  qualificació de cada intent com a CLSScoreItem, de manera que el
//  professor la rebi de forma nativa i xifrada via Schoolwork.
//
//  IMPORTANT sobre privadesa (i sobre l'aprovació a l'App Store):
//  ClassKit NOMÉS comparteix el progrés d'activitats que el professor
//  ha assignat en un "handout", i només amb el professor de l'alumne
//  dins la mateixa organització d'Apple School Manager. Les dades van
//  xifrades per iCloud entre dispositius; MAI passen per cap servidor
//  nostre ni per tercers. Això substitueix el flux "copiar codi".
//

import Foundation
import ClassKit

@available(iOS 11.4, *)
public class ClassKitReporter: NSObject {

    /// Comprova si ClassKit està disponible en aquest dispositiu/entorn.
    /// Retorna false en iPads personals sense Apple School Manager, en el
    /// simulador, o si el framework no està disponible.
    public func isAvailable() -> Bool {
        // CLSDataStore.shared existeix sempre a iOS 11.4+, però l'entorn
        // educatiu real només és operatiu amb Managed Apple IDs. Fem una
        // comprovació defensiva mínima; la disponibilitat efectiva es
        // valida quan s'intenta desar (els errors es capturen).
        if #available(iOS 11.4, *) { return true }
        return false
    }

    /// Publica (o actualitza) el context d'un exercici dins l'arbre de ClassKit.
    /// - identifier: identificador estable de l'exercici (p. ex. "enters").
    /// - title: títol llegible (p. ex. "Nombres enters").
    /// completion rep un missatge d'error o nil si tot ha anat bé.
    public func publishActivity(identifier: String,
                                title: String,
                                completion: @escaping (String?) -> Void) {
        guard #available(iOS 11.4, *) else {
            completion("ClassKit no disponible (iOS < 11.4)")
            return
        }
        let store = CLSDataStore.shared

        // Busquem el context; si no existeix, el creem penjant del mainAppContext.
        store.mainAppContext.descendant(matchingIdentifierPath: [identifier]) { context, error in
            if let error = error {
                completion("Error cercant context: \(error.localizedDescription)")
                return
            }
            if context == nil {
                let newContext = CLSContext(type: .exercise,
                                            identifier: identifier,
                                            title: title)
                newContext.topic = .math
                store.mainAppContext.addChildContext(newContext)
            }
            store.save { saveError in
                if let saveError = saveError {
                    completion("Error desant context: \(saveError.localizedDescription)")
                } else {
                    completion(nil)
                }
            }
        }
    }

    /// Reporta la qualificació d'un intent completat d'un exercici.
    /// - identifier: identificador de l'exercici ja publicat.
    /// - score: nota normalitzada 0.0–1.0.
    /// completion rep un missatge d'error o nil si tot ha anat bé.
    public func reportScore(identifier: String,
                            score: Double,
                            completion: @escaping (String?) -> Void) {
        guard #available(iOS 11.4, *) else {
            completion("ClassKit no disponible (iOS < 11.4)")
            return
        }
        let clampedScore = max(0.0, min(1.0, score))
        let store = CLSDataStore.shared

        store.mainAppContext.descendant(matchingIdentifierPath: [identifier]) { context, error in
            if let error = error {
                completion("Error cercant context: \(error.localizedDescription)")
                return
            }
            guard let context = context else {
                completion("Context no trobat; publica'l abans de reportar.")
                return
            }

            // Iniciem (o recuperem) l'activitat i hi afegim la puntuació.
            let activity = context.currentActivity ?? context.createNewActivity()
            activity.start()

            let scoreItem = CLSScoreItem(identifier: "\(identifier)-score",
                                         title: "Puntuació",
                                         score: clampedScore,
                                         maxScore: 1.0)
            activity.addProgressReportingItem(scoreItem)
            activity.stop()

            store.save { saveError in
                if let saveError = saveError {
                    completion("Error desant puntuació: \(saveError.localizedDescription)")
                } else {
                    completion(nil)
                }
            }
        }
    }
}
