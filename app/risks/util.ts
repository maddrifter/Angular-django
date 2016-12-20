/// <reference path='../_all.ts' />

module scrumdo {
    export const riskScore = (risk) => risk.probability / 100 * _.keys(risk)
                                        .filter((key)=>key.substr(0,8)=='severity')
                                        .reduce((acc, curr) => acc + risk[curr], 0)
}
